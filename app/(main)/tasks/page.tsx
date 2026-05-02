import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import TaskBoardClient from './TaskBoardClient';

export default async function TasksPage() {
  const session = await getSession();
  if (!session) return null;

  const whereClause: any = {};
  if (session.role !== 'ADMIN') {
    whereClause.assignedToId = session.id;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      project: true,
      assignedTo: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  const projects = session.role === 'ADMIN' ? await prisma.project.findMany({ select: { id: true, name: true } }) : [];
  const users = session.role === 'ADMIN' ? await prisma.user.findMany({ select: { id: true, name: true } }) : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{session.role === 'ADMIN' ? 'All Tasks' : 'My Tasks'}</h1>
      </div>

      <TaskBoardClient initialTasks={tasks} role={session.role} projects={projects} users={users} />
    </div>
  );
}
