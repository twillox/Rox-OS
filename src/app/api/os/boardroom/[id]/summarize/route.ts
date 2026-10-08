import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BoardroomService } from '@/lib/services/BoardroomService';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id: meetingId } = resolvedParams;
    
    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const draftDecisions = await BoardroomService.concludeMeeting(businessId, meetingId);

    // Return the generated decisions
    return NextResponse.json({ result: { decisions: draftDecisions } });
  } catch (error: any) {
    console.error('Boardroom Summarize Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
