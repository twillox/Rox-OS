import { IntegrationProvider, OAuthCallbackResult } from './IntegrationProvider';

export class NotionProvider implements IntegrationProvider {
  readonly providerId = 'notion';

  private getClientId(): string {
    return process.env.NOTION_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    return process.env.NOTION_CLIENT_SECRET || '';
  }

  public getRedirectUri(baseUrl: string = 'http://localhost:3000'): string {
    return process.env.NOTION_REDIRECT_URI || `${baseUrl}/api/integrations/notion/callback`;
  }

  getAuthorizationUrl(userId: string, state: string, options?: { scopes?: string[]; baseUrl?: string }): string {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('NOTION_CLIENT_ID is not configured in environment variables.');
    }

    const redirectUri = this.getRedirectUri(options?.baseUrl);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: redirectUri,
      state,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state?: string, baseUrl?: string): Promise<OAuthCallbackResult> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri(baseUrl);

    if (!clientId || !clientSecret) {
      throw new Error('Notion OAuth credentials (NOTION_CLIENT_ID / NOTION_CLIENT_SECRET) are missing.');
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Notion token exchange HTTP error: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(`Notion OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    const workspaceId = tokenData.workspace_id || 'unknown_workspace';
    const workspaceName = tokenData.workspace_name || 'Notion Workspace';
    const ownerName = tokenData.owner?.user?.name || workspaceName;
    const ownerEmail = tokenData.owner?.user?.person?.email || '';

    return {
      profile: {
        providerAccountId: workspaceId,
        providerAccountName: `${workspaceName}${ownerName ? ` (${ownerName})` : ''}`,
        avatarUrl: tokenData.workspace_icon || tokenData.owner?.user?.avatar_url || '',
        metadata: {
          workspaceId,
          workspaceName,
          botId: tokenData.bot_id,
          owner: tokenData.owner,
          ownerEmail,
        },
      },
      tokens: {
        accessToken,
        tokenType: tokenData.token_type || 'bearer',
        scopes: ['read_content', 'update_content', 'insert_content'],
      },
    };
  }
}
