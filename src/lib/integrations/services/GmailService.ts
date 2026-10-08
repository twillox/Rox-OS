import { IntegrationService } from '../IntegrationService';

export interface EmailSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  labels: string[];
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export class GmailService {
  private static encodeEmail(to: string, subject: string, body: string, isHtml: boolean = false): string {
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
      'Content-Transfer-Encoding: 7bit',
      '',
      body,
    ];

    return Buffer.from(emailLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private static parseEmailDetails(msg: any): EmailSummary {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: msg.id,
      threadId: msg.threadId,
      snippet: msg.snippet || '',
      subject: getHeader('Subject') || '(No Subject)',
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      labels: msg.labelIds || [],
    };
  }

  public static async getRecentEmails(userId: string, maxResults: number = 10): Promise<EmailSummary[]> {
    const token = await IntegrationService.getValidAccessToken(userId, 'gmail');

    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      throw new Error(`Gmail API list failed: ${listRes.status} - ${err}`);
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    // Fetch message summaries concurrently for fast latency
    const summaries: EmailSummary[] = await Promise.all(
      messages.map(async (item: any) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (detailRes.ok) {
            const msgDetail = await detailRes.json();
            return this.parseEmailDetails(msgDetail);
          }
        } catch (e) {}
        return null;
      })
    ).then(results => results.filter((s): s is EmailSummary => s !== null));

    return summaries;
  }

  public static async searchEmails(userId: string, query: string, maxResults: number = 10): Promise<EmailSummary[]> {
    const token = await IntegrationService.getValidAccessToken(userId, 'gmail');

    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const listRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      throw new Error(`Gmail search failed: ${listRes.status} - ${err}`);
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    const summaries: EmailSummary[] = [];
    for (const item of messages) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (detailRes.ok) {
        const msgDetail = await detailRes.json();
        summaries.push(this.parseEmailDetails(msgDetail));
      }
    }

    return summaries;
  }

  public static async getEmail(userId: string, messageId: string): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'gmail');

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gmail get message failed: ${res.status} - ${err}`);
    }

    return await res.json();
  }

  public static async sendEmail(userId: string, payload: SendEmailPayload): Promise<{ id: string; threadId: string }> {
    const token = await IntegrationService.getValidAccessToken(userId, 'gmail');
    const raw = this.encodeEmail(payload.to, payload.subject, payload.body, payload.isHtml);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gmail send failed: ${res.status} - ${err}`);
    }

    return await res.json();
  }

  public static async createDraft(userId: string, payload: SendEmailPayload): Promise<{ id: string; message: any }> {
    const token = await IntegrationService.getValidAccessToken(userId, 'gmail');
    const raw = this.encodeEmail(payload.to, payload.subject, payload.body, payload.isHtml);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: { raw },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gmail create draft failed: ${res.status} - ${err}`);
    }

    return await res.json();
  }
}
