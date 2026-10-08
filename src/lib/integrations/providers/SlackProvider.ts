import { IntegrationProvider, OAuthCallbackResult } from './IntegrationProvider';

export class SlackProvider implements IntegrationProvider {
  readonly providerId = 'slack';

  private getClientId(): string {
    return process.env.SLACK_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    return process.env.SLACK_CLIENT_SECRET || '';
  }

  public getRedirectUri(baseUrl: string = 'http://localhost:3000'): string {
    return process.env.SLACK_REDIRECT_URI || `${baseUrl}/api/integrations/slack/callback`;
  }

  getAuthorizationUrl(userId: string, state: string, options?: { scopes?: string[]; baseUrl?: string }): string {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('SLACK_CLIENT_ID is not configured in environment variables.');
    }

    const redirectUri = this.getRedirectUri(options?.baseUrl);
    const scopes = options?.scopes || ['channels:read', 'channels:history', 'chat:write', 'users:read'];

    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(','),
      redirect_uri: redirectUri,
      state,
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state?: string, baseUrl?: string): Promise<OAuthCallbackResult> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri(baseUrl);

    if (!clientId || !clientSecret) {
      throw new Error('Slack OAuth credentials (SLACK_CLIENT_ID / SLACK_CLIENT_SECRET) are missing.');
    }

    // 1. Exchange code for access token via Slack oauth.v2.access
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Slack token exchange HTTP error: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.ok) {
      throw new Error(`Slack OAuth error: ${tokenData.error || 'Failed to exchange token'}`);
    }

    const accessToken = tokenData.access_token;
    const teamId = tokenData.team?.id || 'unknown_team';
    const teamName = tokenData.team?.name || 'Slack Workspace';
    const authedUserId = tokenData.authed_user?.id || tokenData.bot_user_id || teamId;
    const grantedScopes = tokenData.scope ? tokenData.scope.split(',') : [];

    return {
      profile: {
        providerAccountId: teamId,
        providerAccountName: `${teamName} (${authedUserId})`,
        metadata: {
          teamId,
          teamName,
          botUserId: tokenData.bot_user_id,
          authedUserId: tokenData.authed_user?.id,
          appId: tokenData.app_id,
        },
      },
      tokens: {
        accessToken,
        tokenType: tokenData.token_type || 'Bearer',
        scopes: grantedScopes,
      },
    };
  }
}
