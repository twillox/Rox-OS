import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GmailService } from '@/lib/integrations/services/GmailService';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const body = await req.json();
    const { to, subject, body: emailBody, isHtml } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const result = await GmailService.createDraft(userId, {
      to,
      subject,
      body: emailBody,
      isHtml: !!isHtml,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Gmail API draft error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create email draft' },
      { status: 500 }
    );
  }
}
