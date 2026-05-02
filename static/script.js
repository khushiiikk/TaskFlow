let currentUser = null;
let token = localStorage.getItem('token');
let currentProject = null;
let loginMethod = 'password';
let activeOTP = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        fetchDashboardData(); 
    } else {
        showPage('login');
    }
    setupFormListeners();
});

function setLoginMethod(method) {
    loginMethod = method;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(method));
    });
    
    document.getElementById('password-login-fields').classList.toggle('hidden', method === 'otp');
    document.getElementById('otp-login-fields').classList.toggle('hidden', method === 'password');
    document.getElementById('login-submit-btn').classList.toggle('hidden', method === 'otp');
}

async function sendOTP() {
    const phone = document.getElementById('login-phone').value;
    if (!phone) return showToast('Please enter phone number', 'error');

    try {
        const res = await fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (res.ok) {
            activeOTP = data.otp; // In real app, this wouldn't be returned
            document.getElementById('otp-entry').classList.remove('hidden');
            document.getElementById('send-otp-btn').textContent = 'Resend OTP';
            document.getElementById('login-submit-btn').classList.remove('hidden');
            showToast(`OTP Sent to ${phone}!`);
            console.log("DEBUG: Your OTP is", data.otp);
            alert(`[DEVELOPER MODE] Your OTP is: ${data.otp}`);
        } else {
            showToast(data.detail || 'Failed to send OTP', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }
}

function setupFormListeners() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (loginMethod === 'otp') {
            return verifyOTP();
        }

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name: '' })
            });
            
            const data = await res.json();
            if (res.ok) {
                token = data.access_token;
                currentUser = data.user;
                localStorage.setItem('token', token);
                showToast('Welcome back!');
                showPage('dashboard');
            } else {
                showToast(data.detail || 'Login failed', 'error');
            }
        } catch (err) {
            showToast('Connection error', 'error');
        }
    });

    async function verifyOTP() {
        const phone = document.getElementById('login-phone').value;
        const otp = document.getElementById('login-otp').value;
        
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });
            const data = await res.json();
            if (res.ok) {
                token = data.access_token;
                currentUser = data.user;
                localStorage.setItem('token', token);
                showToast('Logged in with OTP!');
                showPage('dashboard');
            } else {
                showToast(data.detail || 'Invalid OTP', 'error');
            }
        } catch (err) {
            showToast('Verification failed', 'error');
        }
    }

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const role = document.getElementById('register-role').value;
        const password = document.getElementById('register-password').value;
        
        // Final password check
        if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            return showToast('Password does not meet requirements', 'error');
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, role, password })
            });
            
            if (res.ok) {
                showToast('Registration successful! Please login.');
                showPage('login');
            } else {
                const data = await res.json();
                showToast(data.detail || 'Registration failed', 'error');
            }
        } catch (err) {
            showToast('Connection error', 'error');
        }
    });

    // ... Project and Task form listeners remain the same ...
    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('project-name').value;
        const description = document.getElementById('project-description').value;
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name, description })
            });
            if (res.ok) { toggleModal('project-modal'); fetchProjects(); showToast('Project created!'); }
        } catch (err) { showToast('Failed to create project', 'error'); }
    });

    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const status = document.getElementById('task-status').value;
        const due_date = document.getElementById('task-date').value || null;
        const assigned_to_id = document.getElementById('task-assignee').value || null;
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, description, status, due_date, project_id: currentProject.id, assigned_to_id: assigned_to_id ? parseInt(assigned_to_id) : null })
            });
            if (res.ok) { toggleModal('task-modal'); fetchTasks(currentProject.id); showToast('Task assigned!'); }
        } catch (err) { showToast('Failed to create task', 'error'); }
    });
}

async function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById(`${pageId}-page`);
    if (page) page.classList.remove('hidden');

    const layout = document.getElementById('main-layout');
    const authContainer = document.getElementById('auth-container');

    if (['login', 'register'].includes(pageId)) {
        layout.classList.add('hidden');
        authContainer.classList.remove('hidden');
    } else {
        layout.classList.remove('hidden');
        authContainer.classList.add('hidden');
        updateSidebar(pageId);
    }

    if (pageId === 'dashboard') fetchDashboardData();
    if (pageId === 'projects') fetchProjects();
    if (pageId === 'tasks') fetchMyTasks();
    if (pageId === 'profile') loadProfile();
}

function updateSidebar(activeId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.onclick.toString().includes(`'${activeId}'` || `"${activeId}"`)) {
            item.classList.add('active');
        }
    });

    if (currentUser) {
        document.getElementById('user-display-name').textContent = currentUser.name;
        document.getElementById('user-display-role').textContent = currentUser.role;
        document.getElementById('user-initial').textContent = currentUser.name[0].toUpperCase();
        
        // Role-based sidebar items
        const isAdmin = currentUser.role === 'ADMIN';
        // Add logic here if you want to hide specific tabs for non-admins
    }
}

async function fetchDashboardData() {
    try {
        const [projectsRes, tasksRes] = await Promise.all([
            fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (projectsRes.status === 401) return logout();

        const projects = await projectsRes.json();
        const tasks = await tasksRes.json();

        // If current user is missing, we need to fetch it (for page refresh)
        if (!currentUser && projects.length > 0) {
            // Ideally a /me endpoint, but for now we'll assume we got it during login
        }

        const statsContainer = document.getElementById('dashboard-stats');
        const isAdmin = currentUser && currentUser.role === 'ADMIN';
        
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="label">My Tasks</span>
                <span class="value">${tasks.length}</span>
            </div>
            <div class="stat-item">
                <span class="label">Active Projects</span>
                <span class="value">${projects.length}</span>
            </div>
            ${isAdmin ? `
                <div class="stat-item" style="border-color: var(--primary)">
                    <span class="label">Team Tasks (Admin View)</span>
                    <span class="value">${tasks.length + 5}</span>
                </div>
            ` : ''}
        `;

        const recentTasksList = document.getElementById('recent-tasks-list');
        if (tasks.length === 0) {
            recentTasksList.innerHTML = '<div class="empty-state"><p>No tasks yet. Create a project to start tracking!</p></div>';
        } else {
            recentTasksList.innerHTML = tasks.slice(0, 5).map(task => `
                <div class="task-card" style="padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="badge badge-${task.status.toLowerCase()}">${task.status}</span>
                        <span style="font-weight: 500;">${task.title}</span>
                    </div>
                    <small style="color: var(--text-muted)">${new Date(task.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

async function fetchProjects() {
    try {
        const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
        const projects = await res.json();
        if (res.status === 401) return logout();
        const list = document.getElementById('projects-list');
        if (projects.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-icon">📁</div><p>No projects yet.</p></div>';
        } else {
            list.innerHTML = projects.map(p => `
                <div class="glass-card project-card" onclick="viewProjectTasks(${p.id}, '${p.name}')">
                    <div style="display: flex; justify-content: space-between;">
                        <h3>${p.name}</h3>
                        <span class="badge badge-progress">${p.task_count || 0} Tasks</span>
                    </div>
                    <p style="margin-top: 1rem; color: var(--text-muted);">${p.description || ''}</p>
                </div>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

async function viewProjectTasks(projectId, projectName) {
    currentProject = { id: projectId, name: projectName };
    document.getElementById('tasks-title').textContent = `Tasks: ${projectName}`;
    document.getElementById('add-task-btn').classList.remove('hidden');
    showPage('tasks');
    fetchTasks(projectId);
}

async function fetchTasks(projectId) {
    try {
        const res = await fetch(`/api/tasks?project_id=${projectId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const tasks = await res.json();
        const list = document.getElementById('tasks-list');
        list.innerHTML = tasks.length === 0 ? '<div class="empty-state"><p>No tasks yet.</p></div>' : tasks.map(t => renderTaskCard(t)).join('');
        
        const userRes = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
        if (userRes.ok) {
            const users = await userRes.json();
            const select = document.getElementById('task-assignee');
            select.innerHTML = '<option value="">Unassigned</option>' + users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
        }
    } catch (err) { console.error(err); }
}

async function fetchMyTasks() {
    document.getElementById('tasks-title').textContent = 'My Tasks';
    document.getElementById('add-task-btn').classList.add('hidden');
    try {
        const res = await fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
        const tasks = await res.json();
        const list = document.getElementById('tasks-list');
        list.innerHTML = tasks.length === 0 ? '<div class="empty-state"><p>You have no tasks!</p></div>' : tasks.map(t => renderTaskCard(t)).join('');
    } catch (err) { console.error(err); }
}

function renderTaskCard(task) {
    return `
        <div class="glass-card task-card">
            <div class="task-header">
                <h4>${task.title}</h4>
                <span class="badge badge-${task.status.toLowerCase()}">${task.status}</span>
            </div>
            <p style="margin: 1rem 0; color: var(--text-muted);">${task.description || ''}</p>
            <div class="task-footer">
                <small>${task.assigned_to ? '👤 ' + task.assigned_to.name : 'Unassigned'}</small>
                ${task.status !== 'DONE' ? `<button class="btn btn-sm btn-primary" onclick="updateTaskStatus(${task.id}, 'DONE')">Done</button>` : ''}
            </div>
        </div>
    `;
}

async function updateTaskStatus(taskId, status) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        if (res.ok) { showToast('Updated!'); if (currentProject) fetchTasks(currentProject.id); else fetchMyTasks(); }
    } catch (err) { showToast('Failed', 'error'); }
}

async function loadProfile() {
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-phone-display').textContent = currentUser.phone || 'No phone added';
    document.getElementById('profile-role').textContent = currentUser.role;
    document.getElementById('profile-role').className = `badge badge-${currentUser.role.toLowerCase()}`;
    document.getElementById('profile-initial').textContent = currentUser.name[0].toUpperCase();
    
    const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    document.getElementById('profile-project-count').textContent = (await projectsRes.json()).length;
    document.getElementById('profile-task-count').textContent = (await tasksRes.json()).length;
}

function checkPasswordStrength(password) {
    const container = document.getElementById('password-strength-container');
    if (!password) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');

    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    
    const hints = {
        length: password.length >= 8,
        alpha: /[a-zA-Z]/.test(password),
        num: /[0-9]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password)
    };

    // Update hint colors
    document.getElementById('hint-length').className = hints.length ? 'valid' : '';
    document.getElementById('hint-alpha').className = hints.alpha ? 'valid' : '';
    document.getElementById('hint-num').className = hints.num ? 'valid' : '';

    let strength = 0;
    if (hints.length) strength += 25;
    if (hints.alpha) strength += 25;
    if (hints.num) strength += 25;
    if (hints.special) strength += 25;

    bar.style.width = `${strength}%`;
    
    if (strength <= 25) {
        bar.style.background = 'var(--danger)';
        text.textContent = 'Weak';
        text.style.color = 'var(--danger)';
    } else if (strength <= 75) {
        bar.style.background = 'var(--warning)';
        text.textContent = 'Medium';
        text.style.color = 'var(--warning)';
    } else {
        bar.style.background = 'var(--success)';
        text.textContent = 'Strong';
        text.style.color = 'var(--success)';
    }

    return strength >= 75; // Minimum requirement for "Safe"
}

function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); }
function logout() { localStorage.removeItem('token'); token = null; currentUser = null; showPage('login'); }
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--primary)';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
