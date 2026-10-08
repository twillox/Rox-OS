import { IntegrationService } from '../IntegrationService';

export class SlackService {
  public static async listChannels(userId: string): Promise<any[]> {
    const token = await IntegrationService.getValidAccessToken(userId, 'slack');

    const res = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Slack conversations.list failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return (data.channels || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      isPrivate: c.is_private,
      numMembers: c.num_members,
    }));
  }

  public static async postMessage(userId: string, channel: string, text: string): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'slack');

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Slack chat.postMessage failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }
}
