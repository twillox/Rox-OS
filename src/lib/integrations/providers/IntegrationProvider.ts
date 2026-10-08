export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scopes: string[];
}

export interface ProviderAccountProfile {
  providerAccountId: string;
  providerAccountName: string;
  avatarUrl?: string;
  metadata?: Record<string, any>;
}

export interface OAuthCallbackResult {
  profile: ProviderAccountProfile;
  tokens: OAuthTokens;
}

export interface IntegrationProvider {
  readonly providerId: string;
  
  getAuthorizationUrl(userId: string, state: string, options?: { service?: string; scopes?: string[]; baseUrl?: string }): string;
  
  handleCallback(code: string, state?: string, baseUrl?: string): Promise<OAuthCallbackResult>;
  
  refreshAccessToken?(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn?: number;
    refreshToken?: string;
  }>;
}
