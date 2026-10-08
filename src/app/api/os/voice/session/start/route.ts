import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VoiceStudioService } from '@/lib/services/VoiceStudioService';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let businessId = cookieStore.get('businessId')?.value;

    if (!businessId) {
      const defaultCompany = await prisma.business.findFirst().catch(() => null);
      businessId = defaultCompany?.id || 'system';
    }

    const session = await VoiceStudioService.startSession(businessId || 'system', employeeId, 'CEO');

    return NextResponse.json({
      ...session,
      sessionId: session.id
    });
  } catch (error: any) {
    console.error('Voice Session Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
