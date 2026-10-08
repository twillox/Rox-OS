import prisma from '@/lib/prisma';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import { GoogleProvider } from './providers/GoogleProvider';
import { GitHubProvider } from './providers/GitHubProvider';
import { SlackProvider } from './providers/SlackProvider';
import { NotionProvider } from './providers/NotionProvider';
import { LinkedInProvider } from './providers/LinkedInProvider';
import { IntegrationProvider, OAuthCallbackResult } from './providers/IntegrationProvider';

export interface PublicIntegrationStatus {
  id: string; // The UI key e.g. 'gmail', 'google-calendar', 'google-drive', 'github', 'slack', 'notion', 'linkedin'
  provider: string; // Internal db key e.g. 'google_gmail'
  status: 'Connected' | 'Disconnected' | 'Coming Soon' | 'Error';
  providerAccountId?: string;
  providerAccountName?: string;
  avatarUrl?: string;
  lastConnectedAt?: string;
  scopes?: string[];
}

export class IntegrationService {
  private static googleProvider = new GoogleProvider();
  private static githubProvider = new GitHubProvider();
  private static slackProvider = new SlackProvider();
  private static notionProvider = new NotionProvider();
  private static linkedinProvider = new LinkedInProvider();

  /**
   * Resolves a provider string to its corresponding IntegrationProvider instance.
   */
  public static getProviderInstance(providerName: string): { provider: IntegrationProvider; serviceSubtype?: string } {
    const normalized = providerName.toLowerCase().replace(/_/g, '-');
    if (normalized === 'google' || normalized === 'gmail' || normalized === 'google-gmail') {
      return { provider: this.googleProvider, serviceSubtype: 'gmail' };
    }
    if (normalized === 'google-calendar' || normalized === 'calendar') {
      return { provider: this.googleProvider, serviceSubtype: 'calendar' };
    }
    if (normalized === 'google-drive' || normalized === 'drive') {
      return { provider: this.googleProvider, serviceSubtype: 'drive' };
    }
    if (normalized === 'github') {
      return { provider: this.githubProvider };
    }
    if (normalized === 'slack') {
      return { provider: this.slackProvider };
    }
    if (normalized === 'notion') {
      return { provider: this.notionProvider };
    }
    if (normalized === 'linkedin') {
      return { provider: this.linkedinProvider };
    }

    throw new Error(`Unsupported integration provider: ${providerName}`);
  }

  /**
   * Normalizes UI/API provider key to canonical DB provider name.
   */
  public static toDbProviderKey(key: string): string {
    const k = key.toLowerCase().replace(/-/g, '_');
    if (k === 'gmail') return 'google_gmail';
    if (k === 'google_calendar' || k === 'calendar') return 'google_calendar';
    if (k === 'google_drive' || k === 'drive') return 'google_drive';
    if (k === 'linkedin') return 'linkedin';
    return k;
  }

  /**
   * Normalizes DB provider key to UI card ID.
   */
  public static toCardId(dbKey: string): string {
    if (dbKey === 'google_gmail') return 'gmail';
    if (dbKey === 'google_calendar') return 'google-calendar';
    if (dbKey === 'google_drive') return 'google-drive';
    if (dbKey === 'linkedin') return 'linkedin';
    return dbKey.replace(/_/g, '-');
  }

  /**
   * Saves or updates an OAuth integration securely in Firestore / Prisma.
   */
  public static async saveOAuthConnection(
    userId: string,
    businessId: string | undefined,
    providerKey: string,
    result: OAuthCallbackResult
  ): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = result.tokens.expiresIn 
      ? new Date(Date.now() + result.tokens.expiresIn * 1000).toISOString() 
      : undefined;

    const encryptedAccessToken = encryptToken(result.tokens.accessToken);
    const encryptedRefreshToken = result.tokens.refreshToken 
      ? encryptToken(result.tokens.refreshToken) 
      : undefined;

    // Determine target DB providers to update
    const targetProviders: string[] = [];
    const normalized = providerKey.toLowerCase().replace(/-/g, '_');

    if (normalized === 'google') {
      // Analyze granted scopes to activate relevant Google integrations
      const joinedScopes = (result.tokens.scopes || []).join(' ');
      if (joinedScopes.includes('mail') || joinedScopes.includes('gmail')) {
        targetProviders.push('google_gmail');
      }
      if (joinedScopes.includes('calendar')) {
        targetProviders.push('google_calendar');
      }
      if (joinedScopes.includes('drive')) {
        targetProviders.push('google_drive');
      }
      // If no specific match, default to all three if user approved the standard prompt
      if (targetProviders.length === 0) {
        targetProviders.push('google_gmail', 'google_calendar', 'google_drive');
      }
    } else {
      targetProviders.push(this.toDbProviderKey(normalized));
    }

    for (const provider of targetProviders) {
      // Find existing
      const existing = await prisma.integration.findFirst({
        where: {
          userId,
          provider,
        },
      });

      const integrationData: any = {
        userId,
        businessId: businessId || 'default_business',
        provider,
        providerAccountId: result.profile.providerAccountId,
        providerAccountName: result.profile.providerAccountName,
        avatarUrl: result.profile.avatarUrl,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken || existing?.refreshTokenEncrypted,
        tokenExpiresAt: expiresAt,
        scopes: result.tokens.scopes || [],
        status: 'Connected',
        metadata: result.profile.metadata || {},
        updatedAt: now,
      };

      if (existing) {
        await prisma.integration.update({
          where: { id: existing.id },
          data: integrationData,
        });
      } else {
        await prisma.integration.create({
          data: {
            ...integrationData,
            createdAt: now,
          },
        });
      }
    }
  }

  /**
   * Retrieves an integration record for a specific user and provider.
   */
  public static async getIntegration(userId: string, providerKey: string) {
    const dbProvider = this.toDbProviderKey(providerKey);
    let record = await prisma.integration.findFirst({
      where: {
        userId,
        provider: dbProvider,
      },
    });

    if (!record) {
      record = await prisma.integration.findFirst({
        where: {
          provider: dbProvider,
          status: 'Connected',
        },
      });
    }

    if (!record) {
      record = await prisma.integration.findFirst({
        where: {
          provider: dbProvider,
        },
      });
    }

    return record;
  }

  /**
   * Retrieves a decrypted, valid access token for API calls.
   * Automatically refreshes expired tokens using the refresh token if available.
   */
  public static async getValidAccessToken(userId: string, providerKey: string): Promise<string> {
    const integration = await this.getIntegration(userId, providerKey);
    if (!integration || integration.status !== 'Connected') {
      throw new Error(`Integration '${providerKey}' is not connected for user.`);
    }

    if (!integration.accessTokenEncrypted) {
      throw new Error(`No access token stored for integration '${providerKey}'.`);
    }

    // Check expiration (with a 2-minute buffer)
    const isExpired = integration.tokenExpiresAt && 
      new Date(integration.tokenExpiresAt).getTime() - 120000 < Date.now();

    if (isExpired && integration.refreshTokenEncrypted) {
      const { provider } = this.getProviderInstance(providerKey);
      if (provider.refreshAccessToken) {
        try {
          const plainRefreshToken = decryptToken(integration.refreshTokenEncrypted);
          const refreshResult = await provider.refreshAccessToken(plainRefreshToken);

          const newEncryptedAccessToken = encryptToken(refreshResult.accessToken);
          const newExpiresAt = refreshResult.expiresIn
            ? new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString()
            : undefined;

          const updateData: any = {
            accessTokenEncrypted: newEncryptedAccessToken,
            tokenExpiresAt: newExpiresAt,
            updatedAt: new Date().toISOString(),
          };

          if (refreshResult.refreshToken) {
            updateData.refreshTokenEncrypted = encryptToken(refreshResult.refreshToken);
          }

          await prisma.integration.update({
            where: { id: integration.id },
            data: updateData,
          });

          return refreshResult.accessToken;
        } catch (refreshErr) {
          console.error(`Token refresh failed for ${providerKey}:`, refreshErr);
          // Mark integration with error status
          await prisma.integration.update({
            where: { id: integration.id },
            data: { status: 'Error', updatedAt: new Date().toISOString() },
          });
          throw new Error(`Authentication token expired and refresh failed. Please reconnect ${providerKey}.`);
        }
      }
    }

    return decryptToken(integration.accessTokenEncrypted);
  }

  /**
   * Disconnects an integration for a user by zeroing credentials and marking Disconnected.
   */
  public static async disconnectIntegration(userId: string, providerKey: string): Promise<void> {
    const dbProvider = this.toDbProviderKey(providerKey);
    const existing = await prisma.integration.findFirst({
      where: {
        userId,
        provider: dbProvider,
      },
    });

    if (existing) {
      await prisma.integration.update({
        where: { id: existing.id },
        data: {
          status: 'Disconnected',
          accessTokenEncrypted: null,
          refreshTokenEncrypted: null,
          tokenExpiresAt: null,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Returns a sanitized public list of user integrations without revealing any tokens.
   */
  public static async listPublicUserIntegrations(userId: string): Promise<Record<string, PublicIntegrationStatus>> {
    let list = await prisma.integration.findMany({
      where: { userId },
    });

    if (!list || list.length === 0) {
      list = await prisma.integration.findMany({
        where: { status: 'Connected' }
      });
    }

    const result: Record<string, PublicIntegrationStatus> = {};

    for (const item of list) {
      const cardId = this.toCardId(item.provider);
      result[cardId] = {
        id: cardId,
        provider: item.provider,
        status: (item.status as any) || 'Disconnected',
        providerAccountId: item.providerAccountId,
        providerAccountName: item.providerAccountName,
        avatarUrl: item.avatarUrl,
        lastConnectedAt: item.updatedAt,
        scopes: item.scopes || [],
      };
    }

    return result;
  }
}
