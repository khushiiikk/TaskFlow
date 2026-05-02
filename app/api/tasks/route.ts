import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const whereClause: any = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    // Members only see tasks assigned to them, Admins see all
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

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, dueDate, projectId, assignedToId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and Project are required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignedToId: assignedToId || null
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
