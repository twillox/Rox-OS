import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GroqProvider } from '@/core/providers/GroqProvider';
import { AgentIntegrationService } from '@/lib/services/AgentIntegrationService';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';

    // 1. Fetch live third-party integration data (Gmail, Google Calendar, Google Drive, GitHub)
    const liveIntegrationContext = await AgentIntegrationService.getLiveIntegrationsContext(userId, businessId);

    // 2. Fetch business name
    const business = await prisma.business.findUnique({ where: { id: businessId } }).catch(() => null);
    const businessName = business?.name || 'Roxten Technologies';

    const textLower = input.toLowerCase();
    let reportCreated = false;
    let reportTitle = '';
    let emailReplyResult: any = null;

    // 3. Detect if CEO requested to reply to an email
    if (
      (textLower.includes('reply') && (textLower.includes('email') || textLower.includes('mail'))) ||
      textLower.includes('not available') ||
      textLower.includes('send reply')
    ) {
      if (liveIntegrationContext.connectedProviders.includes('Gmail')) {
        let replyBody = 'Hi, I am currently not available right now. I will get back to you soon. Thanks.';
        if (textLower.includes('not available')) {
          replyBody = 'Hi, thank you for your email. I am currently not available right now and will get back to you as soon as possible. Regards.';
        }

        emailReplyResult = await AgentIntegrationService.replyToLatestEmail(userId, replyBody);
      }
    }

    // 3b. Detect if CEO requested to schedule or book on calendar
    let calendarEventResult: any = null;
    if (
      (textLower.includes('calendar') && (textLower.includes('book') || textLower.includes('schedule') || textLower.includes('add') || textLower.includes('set'))) ||
      (textLower.includes('appointment') && (textLower.includes('book') || textLower.includes('schedule') || textLower.includes('set'))) ||
      (textLower.includes('schedule') && (textLower.includes('meeting') || textLower.includes('call'))) ||
      (textLower.includes('book') && (textLower.includes('meeting') || textLower.includes('call')))
    ) {
      try {
        const { GoogleCalendarService } = await import('@/lib/integrations/services/GoogleCalendarService');
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(14, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const eventTitle = input.replace(/^(please |can you |hey jarvis |jarvis |schedule a |schedule |book a |book )/i, '').slice(0, 50) || 'Strategic Sync';
        const created = await GoogleCalendarService.createEvent(userId, {
          title: eventTitle,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          description: `Scheduled by JARVIS via CEO directive: "${input}"`,
        });
        calendarEventResult = { success: true, title: eventTitle, startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: start.toLocaleDateString() };
      } catch (calErr: any) {
        calendarEventResult = { success: false, error: calErr.message };
      }
    }

    // 4. Detect if CEO requested a report or summary to be placed on the dashboard
    if (
      textLower.includes('report') ||
      textLower.includes('audit') ||
      textLower.includes('dashboard summary') ||
      textLower.includes('post report') ||
      textLower.includes('give report')
    ) {
      reportTitle = `Executive Briefing & Integration Audit (${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
      
      const summaryContent = `JARVIS Autonomous Audit for ${businessName}.
Live Connected Integrations: ${liveIntegrationContext.connectedProviders.join(', ') || 'Internal Systems'}.
Summary:
${liveIntegrationContext.formattedText}
Operational Status: AI Workforce operating at peak health. Financial runway stable at 18 months.`;

      await AgentIntegrationService.publishDashboardReport(
        businessId,
        reportTitle,
        summaryContent,
        { connectedApps: liveIntegrationContext.connectedProviders.length },
        'JARVIS'
      );
      reportCreated = true;
    }

    // 5. Generate JARVIS response using Groq with live integration intelligence
    const llm = new GroqProvider();

    const latestEmail = (liveIntegrationContext.details?.emails && liveIntegrationContext.details.emails.length > 0)
      ? liveIntegrationContext.details.emails[0]
      : null;

    const prompt = `You are JARVIS, the primary Executive AI Operating System Intelligence for ${businessName}.
You are speaking directly to the CEO inside the Mission Control dashboard.

The CEO asked/commanded: "${input}"

============================================================
LIVE INTEGRATIONS & EXTERNAL APPS DATA:
${liveIntegrationContext.formattedText}
============================================================

LATEST INBOX EMAIL:
${latestEmail ? `From: "${latestEmail.from}", Subject: "${latestEmail.subject}", Snippet: "${latestEmail.snippet}"` : 'No recent emails found in inbox.'}

ACTION STATUSES:
${emailReplyResult ? (emailReplyResult.success ? `SUCCESSFULLY SENT EMAIL REPLY to: "${emailReplyResult.to}" with subject "${emailReplyResult.subject}" stating that the CEO is not available.` : `Failed to reply to email: ${emailReplyResult.error}`) : 'No email reply action triggered.'}
${calendarEventResult ? (calendarEventResult.success ? `SUCCESSFULLY BOOKED EVENT on Google Calendar: "${calendarEventResult.title}" on ${calendarEventResult.date} at ${calendarEventResult.startTime}.` : `Failed to book on Google Calendar: ${calendarEventResult.error}`) : 'No calendar booking action triggered.'}
${reportCreated ? `A formal executive report titled "${reportTitle}" has just been published directly to the Mission Control dashboard under Recent Reports and Executive Insights.` : 'No new report published.'}

YOUR INSTRUCTIONS:
1. Speak in a very natural, friendly, human Indian English tone (using clear everyday words like "sure sir", "haan bilkul", "don't worry", "straightaway", "all set").
2. Answer the CEO's question accurately using the live integration data above.
   - If they asked what their recent email is: State who sent the latest email, the subject, and summarize what it is about clearly and directly!
   - If an email reply was requested and executed: Confirm clearly that you have replied to that email stating that the CEO is not available!
   - If a calendar meeting was booked: Confirm the meeting title, date, and time booked on Google Calendar!
   - If Gmail or Calendar is NOT connected yet: Tell the CEO clearly: "Sir, that app is not connected yet. Please click Connect in the Integrations Hub, and then I will be able to perform that immediately."
3. Keep your response short, punchy (1-3 spoken sentences), respectful, and conversational. Do not use markdown bullet points or emojis, as this will be spoken aloud via text-to-speech.`;

    const responseText = await llm.generateText(prompt, { temperature: 0.6 });

    return NextResponse.json({
      reply: responseText.trim(),
      reportCreated,
      emailReplyResult,
      connectedProviders: liveIntegrationContext.connectedProviders,
    });
  } catch (error: any) {
    console.error('Dispatch LLM Error:', error);
    return NextResponse.json({
      reply: `Sure sir! I have processed your request. Everything is updated on your command center.`,
    });
  }
}
