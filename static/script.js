let currentUser = null;
let token = localStorage.getItem('token');
let currentProject = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        // Simple mock of user from token or fetch user
        // For simplicity in this demo, we'll try to fetch projects to verify token
        fetchProjects();
    } else {
        showPage('login');
    }

    // Form Listeners
    setupFormListeners();
});

function setupFormListeners() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
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

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
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

    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('project-name').value;
        const description = document.getElementById('project-description').value;
        
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description })
            });
            
            if (res.ok) {
                toggleModal('project-modal');
                fetchProjects();
                showToast('Project created!');
            }
        } catch (err) {
            showToast('Failed to create project', 'error');
        }
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
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    title, description, status, due_date, 
                    project_id: currentProject.id, 
                    assigned_to_id: assigned_to_id ? parseInt(assigned_to_id) : null 
                })
            });
            
            if (res.ok) {
                toggleModal('task-modal');
                fetchTasks(currentProject.id);
                showToast('Task assigned!');
            }
        } catch (err) {
            showToast('Failed to create task', 'error');
        }
    });
}

async function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    
    // Show requested page
    const page = document.getElementById(`${pageId}-page`);
    if (page) page.classList.remove('hidden');

    // Handle Navbar visibility
    const navbar = document.getElementById('navbar');
    if (['login', 'register'].includes(pageId)) {
        navbar.classList.add('hidden');
    } else {
        navbar.classList.remove('hidden');
        if (currentUser) {
            document.getElementById('user-display-name').textContent = currentUser.name;
        }
    }

    // Page specific loads
    if (pageId === 'dashboard') fetchDashboardData();
    if (pageId === 'projects') fetchProjects();
    if (pageId === 'tasks') fetchMyTasks();
}

async function fetchDashboardData() {
    try {
        const [projectsRes, tasksRes] = await Promise.all([
            fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const projects = await projectsRes.json();
        const tasks = await tasksRes.json();

        if (projectsRes.status === 401) return logout();

        const statsContainer = document.getElementById('dashboard-stats');
        statsContainer.innerHTML = `
            <div class="glass-card stat-card">
                <span class="stat-value">${projects.length}</span>
                <span class="stat-label">Active Projects</span>
            </div>
            <div class="glass-card stat-card">
                <span class="stat-value">${tasks.length}</span>
                <span class="stat-label">Total Tasks</span>
            </div>
            <div class="glass-card stat-card">
                <span class="stat-value">${tasks.filter(t => t.status === 'DONE').length}</span>
                <span class="stat-label">Completed</span>
            </div>
        `;

        const recentTasksList = document.getElementById('recent-tasks-list');
        recentTasksList.innerHTML = tasks.slice(0, 5).map(task => renderTaskItem(task)).join('');
    } catch (err) {
        console.error(err);
    }
}

async function fetchProjects() {
    try {
        const res = await fetch('/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const projects = await res.json();
        
        if (res.status === 401) return logout();

        // Update current user if null (happens on refresh)
        // In a real app, you'd have a /me endpoint
        if (!currentUser && projects.length >= 0) {
            // Fetch users to at least get some context or handle better
            // For now, we assume user is valid if token works
        }

        const list = document.getElementById('projects-list');
        list.innerHTML = projects.map(p => `
            <div class="glass-card project-card" onclick="viewProjectTasks(${p.id}, '${p.name}')">
                <h3>${p.name}</h3>
                <p>${p.description || 'No description'}</p>
                <div class="project-footer">
                    <span>${p.task_count || 0} Tasks</span>
                    <span>${new Date(p.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

        // Admin check for "New Project" button
        // Note: In real app, check role from decoded JWT
        document.getElementById('add-project-btn').classList.toggle('hidden', false); // Ideally check role
    } catch (err) {
        console.error(err);
    }
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
        const res = await fetch(`/api/tasks?project_id=${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await res.json();
        
        const list = document.getElementById('tasks-list');
        list.innerHTML = tasks.map(t => renderTaskCard(t)).join('');

        // Populate assignees in modal
        const userRes = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
        if (userRes.ok) {
            const users = await userRes.json();
            const select = document.getElementById('task-assignee');
            select.innerHTML = '<option value="">Unassigned</option>' + 
                users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

async function fetchMyTasks() {
    document.getElementById('tasks-title').textContent = 'My Tasks';
    document.getElementById('add-task-btn').classList.add('hidden');
    try {
        const res = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await res.json();
        const list = document.getElementById('tasks-list');
        list.innerHTML = tasks.map(t => renderTaskCard(t)).join('');
    } catch (err) {
        console.error(err);
    }
}

function renderTaskItem(task) {
    return `
        <div class="task-item">
            <span class="badge badge-${task.status.toLowerCase()}">${task.status}</span>
            <span>${task.title}</span>
        </div>
    `;
}

function renderTaskCard(task) {
    return `
        <div class="glass-card task-card">
            <div class="task-header">
                <h4>${task.title}</h4>
                <span class="badge badge-${task.status.toLowerCase()}">${task.status}</span>
            </div>
            <p>${task.description || ''}</p>
            <div class="task-footer">
                <small>Assigned to: ${task.assigned_to ? task.assigned_to.name : 'None'}</small>
                ${task.status !== 'DONE' ? `<button class="btn btn-sm" onclick="updateTaskStatus(${task.id}, 'DONE')">Complete</button>` : ''}
            </div>
        </div>
    `;
}

async function updateTaskStatus(taskId, status) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showToast('Task updated!');
            if (currentProject) fetchTasks(currentProject.id);
            else fetchMyTasks();
        }
    } catch (err) {
        showToast('Update failed', 'error');
    }
}

function toggleModal(id) {
    document.getElementById(id).classList.toggle('hidden');
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    showPage('login');
}

function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--primary)';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
