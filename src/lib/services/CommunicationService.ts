import prisma from '@/lib/prisma';
import { EventService } from './EventService';
import { GroqProvider } from '@/core/providers/GroqProvider';
import { ContextBuilder } from './ContextBuilder';

export type MessageStatus = 'CREATED' | 'DELIVERED' | 'READ' | 'ARCHIVED' | 'DELETED';

export type ThreadType = 'TEXT_CHAT' | 'VOICE_CALL' | 'BOARDROOM' | 'SYSTEM';

export class CommunicationService {

  static async createThread(businessId: string, employeeId: string | 'general', creator: string, threadType: ThreadType = 'TEXT_CHAT') {
    const actId = `act_comm_${Date.now()}`;
    const newAct = await prisma.activity.create({
      data: {
        id: actId,
        businessId,
        employeeId,
        source: 'communication',
        status: 'active',
        updatedAt: new Date(),
        metadata: { threadType }
      }
    });

    // Timeline event
    await EventService.publish({
      businessId,
      module: 'COMMUNICATION',
      eventType: employeeId === 'general' ? 'COMMUNICATION_BROADCAST' : 'COMMUNICATION_THREAD_STARTED',
      title: employeeId === 'general' ? 'Broadcast Started' : 'Direct Thread Started',
      description: `${creator} started a new ${employeeId === 'general' ? 'broadcast' : 'thread'}.`,
      actor: creator,
      metadata: { threadId: actId }
    });

    return actId;
  }

  static async sendMessage(businessId: string, threadId: string, actor: string, content: string, status: MessageStatus = 'DELIVERED') {
    const msgId = `evt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    
    const event = await prisma.activityEvent.create({
      data: {
        id: msgId,
        activityId: threadId,
        eventType: 'MESSAGE',
        actor,
        content,
        metadata: { status }
      }
    });

    // We do NOT publish a timeline event for individual messages.
    return event;
  }

  static async markThreadAsRead(threadId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: threadId }
    });
    
    if (!activity) return;

    const events = await prisma.activityEvent.findMany({ where: { activityId: threadId } });
    activity.ActivityEvent = events;

    // In a real database with schemas we'd do a batch update.
    // For this firebase adapter, we'll individually update events that are 'DELIVERED'.
    const unreadEvents = activity.ActivityEvent.filter((e: any) => !e.metadata || e.metadata.status === 'DELIVERED' || e.metadata.status === 'CREATED');
    
    for (const e of unreadEvents) {
      await prisma.activityEvent.update({
        where: { id: e.id },
        data: {
          metadata: { ...(e.metadata || {}), status: 'READ' }
        }
      });
    }
  }

  static async generateAiReply(businessId: string, threadId: string, employeeId: string) {
    // 1. Fetch History
    const activity = await prisma.activity.findUnique({
      where: { id: threadId }
    });

    if (!activity) throw new Error('Thread not found');

    const rawEvents = await prisma.activityEvent.findMany({ where: { activityId: threadId } });
    activity.ActivityEvent = rawEvents.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

    const history = activity.ActivityEvent.map((e: any) => `${e.actor}: ${e.content}`).join('\n');

    // 2. Build Context
    const aiContext = await ContextBuilder.buildAIContext(businessId, employeeId);

    // 3. Generate Reply
    const llm = new GroqProvider();
    
    // We get the employee name for the final response
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    const empName = employee?.name || 'AI Assistant';

    const prompt = `
${aiContext}

You are participating in an internal company communication thread.
Thread History:
${history}

Reply to the latest message. Keep it concise, natural, and in character.
Do not use generic assistant greetings. Do not say "How can I help you today?". 
You are an integrated employee inside this system.
`;

    const responseText = await llm.generateText(prompt);

    // 4. Save the reply
    const replyEvent = await this.sendMessage(businessId, threadId, empName, responseText.trim(), 'DELIVERED');
    
    return replyEvent;
  }
}
