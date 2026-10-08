import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleCalendarService } from '@/lib/integrations/services/GoogleCalendarService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const url = new URL(req.url);
    const max = parseInt(url.searchParams.get('max') || '10', 10);
    const calendarId = url.searchParams.get('calendarId') || 'primary';

    const events = await GoogleCalendarService.getUpcomingEvents(userId, calendarId, max);
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Google Calendar events error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const body = await req.json();
    const { title, description, startTime, endTime, attendees, location, calendarId } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, startTime, endTime' },
        { status: 400 }
      );
    }

    const event = await GoogleCalendarService.createEvent(userId, {
      title,
      description,
      startTime,
      endTime,
      attendees,
      location,
      calendarId,
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Google Calendar create event error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
