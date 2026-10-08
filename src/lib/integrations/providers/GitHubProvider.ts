import { IntegrationProvider, OAuthCallbackResult } from './IntegrationProvider';

export class GitHubProvider implements IntegrationProvider {
  readonly providerId = 'github';

  private getClientId(): string {
    return process.env.GITHUB_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    return process.env.GITHUB_CLIENT_SECRET || '';
  }

  public getRedirectUri(baseUrl: string = 'http://localhost:3000'): string {
    return process.env.GITHUB_REDIRECT_URI || `${baseUrl}/api/integrations/github/callback`;
  }

  getAuthorizationUrl(userId: string, state: string, options?: { scopes?: string[]; baseUrl?: string }): string {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('GITHUB_CLIENT_ID is not configured in environment variables.');
    }

    const redirectUri = this.getRedirectUri(options?.baseUrl);
    const scopes = options?.scopes || ['repo', 'read:user', 'user:email'];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state,
      allow_signup: 'true',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state?: string, baseUrl?: string): Promise<OAuthCallbackResult> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri(baseUrl);

    if (!clientId || !clientSecret) {
      throw new Error('GitHub credentials (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET) are missing.');
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`GitHub token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    const grantedScopes = tokenData.scope ? tokenData.scope.split(',') : [];

    // 2. Fetch GitHub User Profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Roxten-OS',
      },
    });

    let profileData: any = {};
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    return {
      profile: {
        providerAccountId: String(profileData.id || profileData.login || 'github_user'),
        providerAccountName: profileData.login || profileData.name || 'GitHub User',
        avatarUrl: profileData.avatar_url || '',
        metadata: {
          login: profileData.login,
          name: profileData.name,
          email: profileData.email,
          html_url: profileData.html_url,
          public_repos: profileData.public_repos,
          total_private_repos: profileData.total_private_repos,
        },
      },
      tokens: {
        accessToken,
        tokenType: tokenData.token_type,
        scopes: grantedScopes,
      },
    };
  }
}
