import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventService } from '@/lib/services/EventService';

// Helper to log timeline events
async function logTaskEvent(businessId: string, employeeId: string | null, title: string, content: string, eventType: string) {
  // Timeline using Centralized EventService
  await EventService.publish({
    businessId,
    eventType: eventType as any,
    module: 'TASKS',
    title,
    description: content,
    actor: 'System',
    targetEntity: 'Task',
    severity: eventType.includes('DELETE') ? 'WARNING' : 'INFO',
    relatedEmployeeId: employeeId || undefined
  });

  // Employee Activity
  if (employeeId) {
    let activity = await prisma.activity.findFirst({
      where: { businessId, employeeId, source: 'task_event' }
    });

    if (!activity) {
      activity = await prisma.activity.create({
        data: {
          id: `act_task_${Date.now()}`,
          businessId,
          employeeId,
          source: 'task_event',
          status: 'active',
          updatedAt: new Date().toISOString()
        }
      });
    }

    await prisma.activityEvent.create({
      data: {
        id: `evt_t_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        activityId: activity.id,
        eventType,
        actor: 'System',
        content
      }
    }).catch(() => {});
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    let whereClause: any = { businessId: business.id };
    if (departmentId) whereClause.employee = { departmentId: departmentId };
    if (employeeId) whereClause.employeeId = employeeId;
    if (status) whereClause.status = status;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: { updatedAt: 'desc' },
      take: 100 // Increased from 50 for better overview
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const body = await req.json();
    const { title, description, priority, employeeId, departmentId, dueDate, tags } = body;

    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const task = await prisma.task.create({
      data: {
        businessId,
        title,
        description: description || '',
        priority: priority || 'medium',
        status: 'PENDING',
        employeeId: employeeId || null,
        departmentId: departmentId || null,
        dueDate: dueDate || null,
        tags: tags || [],
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    await logTaskEvent(
      businessId, 
      employeeId, 
      `New Task: ${title}`, 
      `Task created and assigned.`, 
      'TASK_CREATED'
    );

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status, approvalStatus, progress, employeeId, title, description, priority, tags, dueDate } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Fetch existing task to compare status changes for logging
    const existingTask = await prisma.task.findUnique({ where: { id } });
    
    let updateData: any = { updatedAt: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;
    if (progress !== undefined) updateData.progress = progress;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;
    if (dueDate !== undefined) updateData.dueDate = dueDate;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { employee: true }
    });

    // Only log if major status changed or assigned
    if (status && existingTask?.status !== status) {
      await logTaskEvent(
        task.businessId,
        task.employeeId,
        `Task ${status}: ${task.title}`,
        `Task status updated to ${status}.`,
        'TASK_UPDATE'
      );
    } else if (employeeId && existingTask?.employeeId !== employeeId) {
      await logTaskEvent(
        task.businessId,
        task.employeeId,
        `Task Assigned: ${task.title}`,
        `Task reassigned to a new employee.`,
        'TASK_UPDATE'
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    const task = await prisma.task.findUnique({ where: { id } });
    if (task) {
      await prisma.task.delete({ where: { id } });
      await logTaskEvent(
        task.businessId,
        task.employeeId,
        `Task Deleted: ${task.title}`,
        `Task was permanently removed from the backlog.`,
        'TASK_DELETED'
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
