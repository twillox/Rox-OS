import { IntegrationProvider, OAuthCallbackResult } from './IntegrationProvider';

export class LinkedInProvider implements IntegrationProvider {
  readonly providerId = 'linkedin';

  public getClientId(): string {
    return process.env.LINKEDIN_CLIENT_ID || '';
  }

  public getClientSecret(): string {
    return process.env.LINKEDIN_CLIENT_SECRET || '';
  }

  public getRedirectUri(baseUrl: string = 'http://localhost:3000'): string {
    return process.env.LINKEDIN_REDIRECT_URI || `${baseUrl}/api/integrations/linkedin/callback`;
  }

  public getApiVersion(): string {
    return process.env.LINKEDIN_API_VERSION || '202401';
  }

  public validateConfiguration(): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!this.getClientId()) missing.push('LINKEDIN_CLIENT_ID');
    if (!this.getClientSecret()) missing.push('LINKEDIN_CLIENT_SECRET');
    if (!this.getRedirectUri()) missing.push('LINKEDIN_REDIRECT_URI');
    return { isValid: missing.length === 0, missing };
  }

  getAuthorizationUrl(userId: string, state: string, options?: { scopes?: string[]; baseUrl?: string }): string {
    const { isValid, missing } = this.validateConfiguration();
    if (!isValid) {
      throw new Error(`LinkedIn OAuth configuration missing: ${missing.join(', ')}.`);
    }

    const clientId = this.getClientId();
    const redirectUri = this.getRedirectUri(options?.baseUrl);
    
    // Baseline permissions: OpenID Connect identity + Share on LinkedIn
    const defaultScopes = ['openid', 'profile', 'email', 'w_member_social'];
    const scopes = options?.scopes && options.scopes.length > 0 ? options.scopes : defaultScopes;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: scopes.join(' '),
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async handleCallback(code: string, state?: string, baseUrl?: string): Promise<OAuthCallbackResult> {
    const { isValid, missing } = this.validateConfiguration();
    if (!isValid) {
      throw new Error(`LinkedIn OAuth configuration missing: ${missing.join(', ')}.`);
    }

    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri(baseUrl);

    // 1. Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`LinkedIn token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(`LinkedIn OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || undefined;
    const expiresIn = tokenData.expires_in || undefined;
    const grantedScopes: string[] = tokenData.scope 
      ? (typeof tokenData.scope === 'string' ? tokenData.scope.split(/[\s,]+/).filter(Boolean) : tokenData.scope) 
      : ['openid', 'profile', 'email', 'w_member_social'];

    // 2. Retrieve authenticated member identity using OpenID Connect userinfo
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let profileData: any = {};
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    } else {
      console.warn('LinkedIn /v2/userinfo fetch returned non-200:', profileResponse.status);
    }

    const memberId = profileData.sub || 'linkedin_member';
    const memberName = profileData.name || [profileData.given_name, profileData.family_name].filter(Boolean).join(' ') || 'LinkedIn Member';
    const memberEmail = profileData.email || '';
    const avatarUrl = profileData.picture || '';
    const memberUrn = memberId.startsWith('urn:li:person:') ? memberId : `urn:li:person:${memberId}`;

    return {
      profile: {
        providerAccountId: memberId,
        providerAccountName: memberName,
        avatarUrl,
        metadata: {
          sub: memberId,
          urn: memberUrn,
          email: memberEmail,
          given_name: profileData.given_name,
          family_name: profileData.family_name,
          email_verified: profileData.email_verified,
        },
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn,
        scopes: grantedScopes,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number; refreshToken?: string }> {
    const { isValid, missing } = this.validateConfiguration();
    if (!isValid) {
      throw new Error(`LinkedIn configuration missing: ${missing.join(', ')}.`);
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
    });

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LinkedIn token refresh failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
    };
  }
}
