import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CommunicationService } from '@/lib/services/CommunicationService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    let rawActivities = await prisma.activity.findMany({
      where: { businessId: business.id, source: 'communication' }
    });

    if (!rawActivities || rawActivities.length === 0) {
      const threadId = `act_comm_${Date.now()}`;
      await prisma.activity.create({
        data: {
          id: threadId,
          businessId: business.id,
          title: 'Executive Sync & Operations',
          source: 'communication',
          status: 'active',
          updatedAt: new Date().toISOString()
        }
      });

      const initialEvents = [
        {
          id: `evt_c_1`,
          activityId: threadId,
          actor: 'Priya Sharma (Finance)',
          content: 'Good morning team! The monthly accounts are reconciled: $185,000 revenue with $92,000 operational burn. Cash runway is at a comfortable 18 months.',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: `evt_c_2`,
          activityId: threadId,
          actor: 'David Kim (CTO)',
          content: 'Real-time neural audio and Groq streaming latency is holding steady below 240ms across all worker processes.',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: `evt_c_3`,
          activityId: threadId,
          actor: 'Sarah Jenkins (Marketing)',
          content: 'Our B2B founder acquisition funnel went live this morning. Tracking 40+ inbound MQLs today!',
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ];

      for (const ie of initialEvents) {
        await prisma.activityEvent.create({ data: ie }).catch(() => {});
      }

      rawActivities = await prisma.activity.findMany({
        where: { businessId: business.id, source: 'communication' }
      });
    }

    const activities = await Promise.all(rawActivities.map(async (act: any) => {
      const events = await prisma.activityEvent.findMany({
        where: { activityId: act.id }
      });
      return {
        ...act,
        ActivityEvent: (events || []).sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      };
    }));

    activities.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Communication GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { activityId, targetEmployeeId, message, actor } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    let actId = activityId;

    // Create activity (thread) if it doesn't exist
    if (!actId) {
      actId = await CommunicationService.createThread(businessId, targetEmployeeId || 'general', actor || 'CEO');
    }

    // Save the incoming message
    await CommunicationService.sendMessage(businessId, actId, actor || 'CEO', message, 'DELIVERED');

    // If targetEmployeeId is provided and it's not a general broadcast, generate an AI response
    if (targetEmployeeId && targetEmployeeId !== 'general') {
      const aiEvent = await CommunicationService.generateAiReply(businessId, actId, targetEmployeeId);
      return NextResponse.json({ activityId: actId, event: aiEvent });
    }

    return NextResponse.json({ activityId: actId });
  } catch (error: any) {
    console.error('Communication POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { activityId } = await req.json();
    if (!activityId) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });
    
    await CommunicationService.markThreadAsRead(activityId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Communication PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

