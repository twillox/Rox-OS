import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BoardroomService } from '@/lib/services/BoardroomService';
import { CommunicationService } from '@/lib/services/CommunicationService';

export async function POST(req: Request) {
  try {
    const { meetingId, speakerId, ceoMessage } = await req.json();

    if (!meetingId || !speakerId) {
      return NextResponse.json({ error: 'Missing meetingId or speakerId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    // If the CEO is speaking, we just save their message and return
    if (speakerId === 'ceo' && ceoMessage) {
      const replyEvent = await CommunicationService.sendMessage(businessId, meetingId, 'CEO', ceoMessage.trim(), 'DELIVERED');
      return NextResponse.json({ text: ceoMessage, speaker: 'CEO', id: replyEvent.id });
    }

    // Otherwise, generate AI response via BoardroomService
    const result = await BoardroomService.processTurn(businessId, meetingId, speakerId);

    return NextResponse.json({ text: result.text, speaker: result.speaker, id: result.id });
  } catch (error: any) {
    console.error('Boardroom Turn Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

