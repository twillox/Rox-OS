import { IntegrationProvider, OAuthCallbackResult } from './IntegrationProvider';

export class GoogleProvider implements IntegrationProvider {
  readonly providerId = 'google';

  private getClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  }

  public getRedirectUri(baseUrl: string = 'http://localhost:3000'): string {
    return process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/integrations/google/callback`;
  }

  /**
   * Returns scopes tailored to requested services or full productivity suite by default.
   */
  public getDefaultScopes(service?: string): string[] {
    const baseScopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    if (service === 'gmail') {
      return [
        ...baseScopes,
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
      ];
    }

    if (service === 'calendar' || service === 'google-calendar') {
      return [
        ...baseScopes,
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ];
    }

    if (service === 'drive' || service === 'google-drive') {
      return [
        ...baseScopes,
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file',
      ];
    }

    // Default: Combined unified productivity scopes for Roxten OS
    return [
      ...baseScopes,
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ];
  }

  getAuthorizationUrl(userId: string, state: string, options?: { service?: string; scopes?: string[]; baseUrl?: string }): string {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured in environment variables.');
    }

    const redirectUri = this.getRedirectUri(options?.baseUrl);
    const scopes = options?.scopes || this.getDefaultScopes(options?.service);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Always request offline access for refresh token
      prompt: 'consent',     // Force consent screen to guarantee refresh token is returned
      include_granted_scopes: 'true',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string, state?: string, baseUrl?: string): Promise<OAuthCallbackResult> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri(baseUrl);

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing.');
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const grantedScopes = tokenData.scope ? tokenData.scope.split(' ') : [];

    // 2. Fetch authenticated profile info
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let profileData: any = {};
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    return {
      profile: {
        providerAccountId: profileData.sub || profileData.email || 'google_user',
        providerAccountName: profileData.email || profileData.name || 'Google Account',
        avatarUrl: profileData.picture || '',
        metadata: {
          email: profileData.email,
          name: profileData.name,
          locale: profileData.locale,
          email_verified: profileData.email_verified,
        },
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType: tokenData.token_type,
        scopes: grantedScopes,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number; refreshToken?: string }> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!clientId || !clientSecret) {
      throw new Error('Google credentials missing for token refresh.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google token refresh failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token || refreshToken,
    };
  }
}
