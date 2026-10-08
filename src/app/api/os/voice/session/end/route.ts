import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VoiceStudioService } from '@/lib/services/VoiceStudioService';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let businessId = cookieStore.get('businessId')?.value;
    if (!businessId) {
      const active = VoiceStudioService.activeSessions.get(sessionId);
      businessId = active?.businessId || 'system';
    }

    await VoiceStudioService.endSession(businessId || 'system', sessionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Voice Session End Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
