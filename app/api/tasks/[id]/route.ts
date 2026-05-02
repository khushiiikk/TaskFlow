import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if task exists and user has permission
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let dataToUpdate: any = {};

    if (session.role === 'ADMIN') {
      // Admin can update anything
      const { title, description, status, dueDate, assignedToId } = body;
      if (title !== undefined) dataToUpdate.title = title;
      if (description !== undefined) dataToUpdate.description = description;
      if (status !== undefined) dataToUpdate.status = status;
      if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
      if (assignedToId !== undefined) dataToUpdate.assignedToId = assignedToId;
    } else {
      // Member can only update status of their assigned tasks
      if (task.assignedToId !== session.id) {
        return NextResponse.json({ error: 'Forbidden. You can only update your own tasks.' }, { status: 403 });
      }
      
      const { status } = body;
      if (status !== undefined) {
        dataToUpdate.status = status;
      } else {
        return NextResponse.json({ error: 'Members can only update task status.' }, { status: 400 });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
