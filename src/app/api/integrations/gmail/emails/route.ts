import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GmailService } from '@/lib/integrations/services/GmailService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const max = parseInt(url.searchParams.get('max') || '10', 10);

    const emails = q
      ? await GmailService.searchEmails(userId, q, max)
      : await GmailService.getRecentEmails(userId, max);

    return NextResponse.json({ success: true, emails });
  } catch (error: any) {
    console.error('Gmail API emails error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
