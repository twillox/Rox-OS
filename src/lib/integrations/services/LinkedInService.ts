import prisma from '@/lib/prisma';
import { IntegrationService } from '../IntegrationService';
import { LinkedInProvider } from '../providers/LinkedInProvider';
import { EventPipeline } from '@/core/messaging/EventPipeline';
import { EventService } from '@/lib/services/EventService';
import {
  LinkedInCapabilities,
  LinkedInConnectionState,
  LinkedInStatusResponse,
  LinkedInPostRequest,
  LinkedInPostResponse,
  LinkedInFollowerAnalytics,
  LinkedInPostsAnalyticsResponse,
  LinkedInOverviewAnalytics,
  LinkedInDailySnapshot,
  LinkedInPostAnalyticsItem,
} from '../linkedin/types';

export class LinkedInService {
  private static provider = new LinkedInProvider();

  private static getApiVersion(): string {
    return this.provider.getApiVersion();
  }

  private static getHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'LinkedIn-Version': this.getApiVersion(),
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Retrieves user's stored integration record
   */
  public static async getIntegration(userId: string) {
    return IntegrationService.getIntegration(userId, 'linkedin');
  }

  /**
   * Evaluates real granted capabilities based on OAuth token scopes
   */
  public static async getStatus(userId: string): Promise<LinkedInStatusResponse> {
    const integration = await this.getIntegration(userId);

    if (!integration || integration.status !== 'Connected') {
      return {
        connected: false,
        state: 'DISCONNECTED',
        capabilities: {
          profile: false,
          publish: false,
          followerAnalytics: false,
          postAnalytics: false,
        },
        scopes: [],
      };
    }

    const scopes = Array.isArray(integration.scopes) ? integration.scopes : [];
    const joinedScopes = scopes.join(' ');

    const capabilities: LinkedInCapabilities = {
      profile: joinedScopes.includes('openid') || joinedScopes.includes('profile') || joinedScopes.includes('r_liteprofile'),
      publish: joinedScopes.includes('w_member_social'),
      followerAnalytics: joinedScopes.includes('r_member_profileAnalytics'),
      postAnalytics: joinedScopes.includes('r_member_postAnalytics'),
    };

    let state: LinkedInConnectionState = 'CONNECTED_WITHOUT_ANALYTICS';
    if (capabilities.followerAnalytics || capabilities.postAnalytics) {
      state = 'CONNECTED_WITH_ANALYTICS';
    }

    return {
      connected: true,
      state,
      capabilities,
      member: {
        id: integration.providerAccountId,
        name: integration.providerAccountName,
        avatarUrl: integration.avatarUrl,
        email: integration.metadata?.email,
        connectedAt: integration.updatedAt,
      },
      scopes,
    };
  }

  /**
   * Publishes a text post to LinkedIn member's feed using the official REST Posts API
   */
  public static async createPost(userId: string, payload: LinkedInPostRequest): Promise<LinkedInPostResponse> {
    if (!payload.text || !payload.text.trim()) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Post text cannot be empty.',
      };
    }

    const status = await this.getStatus(userId);
    if (!status.connected) {
      return {
        success: false,
        code: 'LINKEDIN_NOT_CONNECTED',
        message: 'LinkedIn is not connected for this account. Please connect first.',
      };
    }

    if (!status.capabilities.publish) {
      return {
        success: false,
        code: 'INSUFFICIENT_SCOPE',
        message: "Your LinkedIn authorization does not include 'w_member_social' posting permission.",
      };
    }

    const token = await IntegrationService.getValidAccessToken(userId, 'linkedin');
    const integration = await this.getIntegration(userId);
    const memberUrn = integration?.metadata?.urn || (integration?.providerAccountId?.startsWith('urn:li:person:') 
      ? integration?.providerAccountId 
      : `urn:li:person:${integration?.providerAccountId}`);

    const postBody = {
      author: memberUrn,
      commentary: payload.text.trim(),
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr: any = {};
      try { parsedErr = JSON.parse(errText); } catch {}

      if (res.status === 401) {
        return { success: false, code: 'UNAUTHORIZED', message: 'LinkedIn authorization token expired or invalid.' };
      }
      if (res.status === 403) {
        return { success: false, code: 'FORBIDDEN', message: parsedErr.message || 'Permission denied by LinkedIn API.' };
      }
      if (res.status === 429) {
        return { success: false, code: 'RATE_LIMITED', message: 'LinkedIn API rate limit exceeded. Please try again later.' };
      }

      return {
        success: false,
        code: 'LINKEDIN_API_ERROR',
        message: parsedErr.message || `LinkedIn API post creation failed: ${res.status} - ${errText}`,
      };
    }

    // Header x-restli-id contains the URN e.g. "urn:li:share:12345678"
    const postId = res.headers.get('x-restli-id') || 'post_published';
    const postUrl = `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}`;

    // Dispatch event to EventPipeline
    try {
      EventPipeline.getInstance().dispatch({
        type: 'SYSTEM_LOG',
        sender: 'LinkedInService',
        receiver: 'all',
        intent: 'LINKEDIN_POST_CREATED',
        payload: { postId, url: postUrl, preview: payload.text.slice(0, 100) },
        priority: 'high',
        status: 'completed',
      });
    } catch {}

    // Publish to centralized Timeline
    try {
      await EventService.publish({
        businessId: integration?.businessId || 'biz_roxten_corp',
        eventType: 'REPORT_GENERATED' as any,
        module: 'MARKETING',
        title: 'LinkedIn Post Published',
        description: `Published post to LinkedIn: "${payload.text.slice(0, 80)}..."`,
        actor: 'LinkedIn Integration',
        targetEntity: 'LinkedInPost',
        severity: 'SUCCESS',
      });
    } catch {}

    return {
      success: true,
      postId,
      url: postUrl,
    };
  }

  /**
   * Retrieves member follower statistics using Community Management API (if authorized)
   */
  public static async getFollowerAnalytics(userId: string, period: string = '7d'): Promise<LinkedInFollowerAnalytics> {
    const status = await this.getStatus(userId);

    if (!status.connected) {
      return {
        currentFollowers: null,
        followersGained: null,
        period,
        data: [],
        analyticsAvailable: false,
        message: 'LinkedIn is not connected.',
      };
    }

    if (!status.capabilities.followerAnalytics) {
      return {
        currentFollowers: null,
        followersGained: null,
        period,
        data: [],
        analyticsAvailable: false,
        message: 'LinkedIn Community Management API approval (r_member_profileAnalytics) is required for follower analytics.',
      };
    }

    try {
      const token = await IntegrationService.getValidAccessToken(userId, 'linkedin');
      const integration = await this.getIntegration(userId);
      const memberUrn = integration?.metadata?.urn || `urn:li:person:${integration?.providerAccountId}`;

      const res = await fetch(`https://api.linkedin.com/rest/memberFollowerStatistics?q=member&member=${encodeURIComponent(memberUrn)}`, {
        headers: this.getHeaders(token),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          currentFollowers: null,
          followersGained: null,
          period,
          data: [],
          analyticsAvailable: false,
          message: `LinkedIn follower statistics query returned ${res.status}: ${errText}`,
        };
      }

      const raw = await res.json();
      const elements = raw.elements || [];

      // Normalize real LinkedIn statistics
      let currentFollowers: number | null = null;
      let followersGained: number | null = 0;
      const dataPoints: { date: string; followers: number }[] = [];

      for (const item of elements) {
        if (item.followerCounts?.organicFollowerCount !== undefined) {
          currentFollowers = (currentFollowers || 0) + item.followerCounts.organicFollowerCount;
        }
        if (item.followerGains?.organicFollowerGain !== undefined) {
          followersGained = (followersGained || 0) + item.followerGains.organicFollowerGain;
        }
      }

      return {
        currentFollowers,
        followersGained,
        period,
        data: dataPoints,
        analyticsAvailable: true,
      };
    } catch (e: any) {
      return {
        currentFollowers: null,
        followersGained: null,
        period,
        data: [],
        analyticsAvailable: false,
        message: e.message,
      };
    }
  }

  /**
   * Retrieves member post analytics using memberCreatorPostAnalytics (if authorized)
   */
  public static async getPostAnalytics(userId: string): Promise<LinkedInPostsAnalyticsResponse> {
    const status = await this.getStatus(userId);

    if (!status.connected) {
      return {
        posts: [],
        analyticsAvailable: false,
        message: 'LinkedIn is not connected.',
      };
    }

    if (!status.capabilities.postAnalytics) {
      return {
        posts: [],
        analyticsAvailable: false,
        message: 'LinkedIn Community Management API approval (r_member_postAnalytics) is required for post analytics.',
      };
    }

    try {
      const token = await IntegrationService.getValidAccessToken(userId, 'linkedin');
      const integration = await this.getIntegration(userId);
      const memberUrn = integration?.metadata?.urn || `urn:li:person:${integration?.providerAccountId}`;

      const res = await fetch(`https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=member&member=${encodeURIComponent(memberUrn)}`, {
        headers: this.getHeaders(token),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          posts: [],
          analyticsAvailable: false,
          message: `LinkedIn post analytics query returned ${res.status}: ${errText}`,
        };
      }

      const raw = await res.json();
      const elements = raw.elements || [];

      const posts: LinkedInPostAnalyticsItem[] = elements.map((item: any) => ({
        id: item.entity || item.id,
        impressions: item.impressionCount ?? null,
        reach: item.membersReachedCount ?? null,
        reactions: item.reactionCount ?? null,
        comments: item.commentCount ?? null,
        reshares: item.reshareCount ?? null,
        saves: item.saveCount ?? null,
        linkClicks: item.linkClickCount ?? null,
        followersGained: item.followersGainedFromContentCount ?? null,
        profileViews: item.profileViewsFromContentCount ?? null,
      }));

      return {
        posts,
        analyticsAvailable: true,
      };
    } catch (e: any) {
      return {
        posts: [],
        analyticsAvailable: false,
        message: e.message,
      };
    }
  }

  /**
   * Aggregates real LinkedIn overview metrics and historical snapshots
   */
  public static async getOverviewAnalytics(userId: string, period: string = '30d'): Promise<LinkedInOverviewAnalytics> {
    const status = await this.getStatus(userId);

    if (!status.connected) {
      return {
        connected: false,
        analyticsAvailable: false,
        capabilities: status.capabilities,
        followers: { current: null, changeToday: null, change7d: null, change30d: null },
        content: { posts: null, impressions: null, reach: null, reactions: null, comments: null, reshares: null },
        topPosts: [],
        period,
      };
    }

    // Fetch real live analytics where capabilities permit
    const [followerData, postData] = await Promise.all([
      this.getFollowerAnalytics(userId, period),
      this.getPostAnalytics(userId),
    ]);

    const analyticsAvailable = followerData.analyticsAvailable || postData.analyticsAvailable;

    // Read user's isolated stored snapshots from database for trend computation
    let snapshots: LinkedInDailySnapshot[] = [];
    try {
      snapshots = await prisma.linkedInSnapshot.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30,
      });
    } catch {}

    const totalImpressions = postData.posts.reduce((acc, p) => acc + (p.impressions || 0), 0);
    const totalReactions = postData.posts.reduce((acc, p) => acc + (p.reactions || 0), 0);
    const totalComments = postData.posts.reduce((acc, p) => acc + (p.comments || 0), 0);
    const totalReshares = postData.posts.reduce((acc, p) => acc + (p.reshares || 0), 0);

    return {
      connected: true,
      analyticsAvailable,
      capabilities: status.capabilities,
      member: status.member,
      followers: {
        current: followerData.currentFollowers,
        changeToday: followerData.followersGained,
        change7d: followerData.followersGained,
        change30d: null,
      },
      content: {
        posts: postData.posts.length > 0 ? postData.posts.length : null,
        impressions: postData.posts.length > 0 ? totalImpressions : null,
        reach: null,
        reactions: postData.posts.length > 0 ? totalReactions : null,
        comments: postData.posts.length > 0 ? totalComments : null,
        reshares: postData.posts.length > 0 ? totalReshares : null,
      },
      topPosts: postData.posts.slice(0, 5),
      period,
      message: !analyticsAvailable ? 'Basic profile & posting connected. Advanced follower and post analytics require LinkedIn Community Management API approval.' : undefined,
    };
  }

  /**
   * Records a user-isolated daily snapshot for historical analytics
   */
  public static async recordDailySnapshot(userId: string): Promise<LinkedInDailySnapshot | null> {
    const overview = await this.getOverviewAnalytics(userId);
    if (!overview.connected) return null;

    const today = new Date().toISOString().split('T')[0];
    const snapshotId = `snp_${userId}_${today}`;

    const snapshotData: LinkedInDailySnapshot = {
      id: snapshotId,
      userId,
      date: today,
      followers: overview.followers.current,
      impressions: overview.content.impressions,
      reactions: overview.content.reactions,
      comments: overview.content.comments,
      reshares: overview.content.reshares,
      reach: overview.content.reach,
      createdAt: new Date().toISOString(),
    };

    try {
      await prisma.linkedInSnapshot.create({
        data: snapshotData,
      });
      return snapshotData;
    } catch {
      return null;
    }
  }
}
