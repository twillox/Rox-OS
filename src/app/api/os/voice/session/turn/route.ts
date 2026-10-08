import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VoiceStudioService } from '@/lib/services/VoiceStudioService';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { sessionId, text, employeeId } = await req.json();

    if (!sessionId || !text) {
      return NextResponse.json({ error: 'sessionId and text required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let businessId = cookieStore.get('businessId')?.value;

    if (!businessId) {
      const activeSess = VoiceStudioService.activeSessions.get(sessionId);
      if (activeSess?.businessId) {
        businessId = activeSess.businessId;
      } else {
        const session = await prisma.voiceSession.findUnique({ where: { id: sessionId } }).catch(() => null);
        if (session?.businessId) {
          businessId = session.businessId;
        } else {
          const defaultCompany = await prisma.business.findFirst().catch(() => null);
          businessId = defaultCompany?.id || 'system';
        }
      }
    }

    const result = await VoiceStudioService.processTurn(businessId || 'system', sessionId, text, 'CEO', employeeId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Voice Session Turn Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
