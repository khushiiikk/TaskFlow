import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import Link from 'next/link';

export default async function Dashboard() {
  const session = await getSession();
  
  if (!session) return null;

  // Fetch dashboard stats
  const projectsCount = await prisma.project.count();
  
  let userTasksCount = 0;
  let overdueTasksCount = 0;
  let recentTasks = [];

  if (session.role === 'ADMIN') {
    userTasksCount = await prisma.task.count();
    overdueTasksCount = await prisma.task.count({
      where: {
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }
      }
    });
    recentTasks = await prisma.task.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { project: true, assignedTo: true }
    });
  } else {
    userTasksCount = await prisma.task.count({
      where: { assignedToId: session.id }
    });
    overdueTasksCount = await prisma.task.count({
      where: {
        assignedToId: session.id,
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }
      }
    });
    recentTasks = await prisma.task.findMany({
      where: { assignedToId: session.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { project: true }
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {session.role === 'ADMIN' && (
            <Link href="/projects" className="btn btn-primary">
              Manage Projects
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Total Projects</h3>
          <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)' }}>{projectsCount}</span>
        </div>
        
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>
            {session.role === 'ADMIN' ? 'Total Tasks' : 'Your Tasks'}
          </h3>
          <span style={{ fontSize: '3rem', fontWeight: 700, color: '#38bdf8' }}>{userTasksCount}</span>
        </div>
        
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Overdue Tasks</h3>
          <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--danger)' }}>{overdueTasksCount}</span>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>Recent Tasks</h2>
      <div className="glass-panel" style={{ padding: '1rem' }}>
        {recentTasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recent tasks found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTasks.map((task) => (
              <div key={task.id} style={{ 
                padding: '1.25rem', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.2s'
              }} className="hover:bg-white/5">
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{task.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Project: {task.project.name} {session.role === 'ADMIN' && task.assignedTo && `• Assigned to: ${task.assignedTo.name}`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
