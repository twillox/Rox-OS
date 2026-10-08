import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { BoardroomService } from '@/lib/services/BoardroomService';

export async function POST(req: Request) {
  try {
    const { topic, participantIds } = await req.json();

    if (!topic || !participantIds || participantIds.length === 0) {
      return NextResponse.json({ error: 'Topic and participants required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const meeting = await BoardroomService.startMeeting(businessId, topic, participantIds, 'CEO');

    return NextResponse.json(meeting);
  } catch (error: any) {
    console.error('Boardroom Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

