import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import Link from 'next/link';
import CreateProjectClient from './CreateProjectClient';

export default async function ProjectsPage() {
  const session = await getSession();
  
  if (!session) return null;

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { tasks: true }
      }
    }
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        {session.role === 'ADMIN' && (
          <CreateProjectClient />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {projects.map(project => (
          <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} 
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{project.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1 }}>
                {project.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Tasks: <strong style={{ color: 'var(--text-main)' }}>{project._count.tasks}</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {projects.length === 0 && (
          <div className="glass-panel" style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
            No projects found. {session.role === 'ADMIN' ? 'Create one to get started!' : 'Ask an admin to create one.'}
          </div>
        )}
      </div>
    </div>
  );
}
