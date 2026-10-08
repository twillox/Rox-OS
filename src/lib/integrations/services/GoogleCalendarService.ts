import { IntegrationService } from '../IntegrationService';

export interface CalendarEventInput {
  title: string;
  description?: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  attendees?: string[]; // email addresses
  location?: string;
  calendarId?: string;
}

export class GoogleCalendarService {
  public static async getCalendarList(userId: string): Promise<any[]> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-calendar');

    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Calendar list failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.items || [];
  }

  public static async getUpcomingEvents(
    userId: string,
    calendarId: string = 'primary',
    maxResults: number = 10
  ): Promise<any[]> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-calendar');
    const timeMin = new Date().toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Calendar events failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary || '(Untitled)',
      description: item.description || '',
      startTime: item.start?.dateTime || item.start?.date,
      endTime: item.end?.dateTime || item.end?.date,
      location: item.location || '',
      attendees: (item.attendees || []).map((a: any) => a.email),
      status: item.status,
      htmlLink: item.htmlLink,
    }));
  }

  public static async createEvent(userId: string, eventData: CalendarEventInput): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-calendar');
    const calendarId = eventData.calendarId || 'primary';

    const body: any = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startTime,
      },
      end: {
        dateTime: eventData.endTime,
      },
    };

    if (eventData.attendees && eventData.attendees.length > 0) {
      body.attendees = eventData.attendees.map(email => ({ email }));
    }

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Calendar create event failed: ${res.status} - ${err}`);
    }

    return await res.json();
  }

  public static async updateEvent(
    userId: string,
    eventId: string,
    eventData: Partial<CalendarEventInput>,
    calendarId: string = 'primary'
  ): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-calendar');

    const patchBody: any = {};
    if (eventData.title !== undefined) patchBody.summary = eventData.title;
    if (eventData.description !== undefined) patchBody.description = eventData.description;
    if (eventData.location !== undefined) patchBody.location = eventData.location;
    if (eventData.startTime !== undefined) patchBody.start = { dateTime: eventData.startTime };
    if (eventData.endTime !== undefined) patchBody.end = { dateTime: eventData.endTime };
    if (eventData.attendees !== undefined) {
      patchBody.attendees = eventData.attendees.map(email => ({ email }));
    }

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Calendar update event failed: ${res.status} - ${err}`);
    }

    return await res.json();
  }

  public static async deleteEvent(userId: string, eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-calendar');

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status !== 404) {
      const err = await res.text();
      throw new Error(`Google Calendar delete event failed: ${res.status} - ${err}`);
    }

    return true;
  }

  public static async findAvailableTime(
    userId: string,
    timeMin: string,
    timeMax: string,
    calendarId: string = 'primary'
  ): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-calendar');

    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Calendar freebusy check failed: ${res.status} - ${err}`);
    }

    return await res.json();
  }
}
