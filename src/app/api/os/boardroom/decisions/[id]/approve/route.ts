import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BoardroomService } from '@/lib/services/BoardroomService';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id: decisionId } = resolvedParams;
    
    if (!decisionId) {
      return NextResponse.json({ error: 'Missing decisionId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await BoardroomService.approveDecision(businessId, decisionId, 'CEO');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Boardroom Decision Approve Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
