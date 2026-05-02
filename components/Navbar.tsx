"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="glass-panel" style={{ 
      margin: '1rem 1.5rem', 
      padding: '1rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'sticky',
      top: '1rem',
      zIndex: 50
    }}>
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          T
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>TaskMaster</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
          <Link href="/projects" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Projects</Link>
          <Link href="/tasks" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Tasks</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'User'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
