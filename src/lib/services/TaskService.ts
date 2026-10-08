import prisma from '@/lib/prisma';
import { EventService } from './EventService';

export class TaskService {
  static async createTask(businessId: string, taskParams: {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
    assigneeId: string | null;
    metadata?: any;
  }) {
    const task = await prisma.task.create({
      data: {
        businessId,
        employeeId: taskParams.assigneeId,
        title: taskParams.title,
        description: taskParams.description,
        status: taskParams.status,
        priority: taskParams.priority,
        metadata: taskParams.metadata || {}
      }
    });

    await EventService.publish({
      businessId,
      module: 'TASKS',
      eventType: 'TASK_CREATED',
      title: 'Task Created',
      description: `Task "${task.title}" was created.`,
      actor: 'System',
      targetEntity: 'Task',
      relatedEntityId: task.id
    });

    return task;
  }
}
