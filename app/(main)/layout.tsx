import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={session} />
      <main className="container" style={{ flex: 1, padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
