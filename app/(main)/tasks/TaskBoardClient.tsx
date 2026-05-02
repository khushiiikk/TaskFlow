"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export default function TaskBoardClient({ initialTasks, role, projects, users }: { 
  initialTasks: any[], 
  role: string,
  projects: any[],
  users: any[]
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assignedToId: '', status: 'TODO' });
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      // Revert on error
      setTasks(initialTasks);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setIsModalOpen(false);
        const createdTask = await res.json();
        // Just refresh to get full relations from server
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: { id: TaskStatus, label: string }[] = [
    { id: 'TODO', label: 'To Do' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'DONE', label: 'Done' }
  ];

  return (
    <>
      {role === 'ADMIN' && (
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            + New Task
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {columns.map(col => (
          <div key={col.id} className="glass-panel" style={{ padding: '1rem', minHeight: '400px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              {col.label} <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>{tasks.filter(t => t.status === col.id).length}</span>
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tasks.filter(t => t.status === col.id).map(task => (
                <div key={task.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{task.project.name}</p>
                  
                  {role === 'ADMIN' && task.assignedTo && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Assigned to: {task.assignedTo.name}
                    </div>
                  )}

                  <select 
                    value={task.status} 
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="input-field"
                    style={{ padding: '0.4rem', fontSize: '0.875rem' }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', backgroundColor: 'var(--bg)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Create New Task</h2>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Task Title</label>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Project</label>
                <select 
                  required 
                  className="input-field" 
                  value={newTask.projectId} 
                  onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                >
                  <option value="">Select a Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Assign To</label>
                <select 
                  className="input-field" 
                  value={newTask.assignedToId} 
                  onChange={e => setNewTask({...newTask, assignedToId: e.target.value})}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
