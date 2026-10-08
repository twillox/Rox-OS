import prisma from '@/lib/prisma';
import { LinkedInService } from '../services/LinkedInService';
import { LinkedInDailySnapshot, LinkedInPostAnalyticsItem } from './types';

export interface GrowthInsight {
  type: 'POSITIVE' | 'WARNING' | 'TIP' | 'INFO';
  title: string;
  description: string;
  metric?: string;
}

export interface GrowthAnalysisReport {
  connected: boolean;
  analyticsAvailable: boolean;
  overallHealthScore: number; // 0 - 100
  summary: string;
  insights: GrowthInsight[];
  topPost: LinkedInPostAnalyticsItem | null;
  lowestPost: LinkedInPostAnalyticsItem | null;
  trends: {
    followerTrend: 'GROWING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';
    engagementRatePercent: number | null;
  };
}

export class LinkedInGrowthAnalyst {
  /**
   * Generates a comprehensive growth analysis and actionable recommendations for the user.
   */
  public static async analyzeGrowth(userId: string): Promise<GrowthAnalysisReport> {
    const status = await LinkedInService.getStatus(userId);

    if (!status.connected) {
      return {
        connected: false,
        analyticsAvailable: false,
        overallHealthScore: 0,
        summary: 'LinkedIn is not connected. Connect your LinkedIn profile to activate AI Growth Analyst.',
        insights: [
          {
            type: 'INFO',
            title: 'Account Disconnected',
            description: 'Connect your LinkedIn account in the Integrations Hub to track engagement and schedule updates.',
          },
        ],
        topPost: null,
        lowestPost: null,
        trends: {
          followerTrend: 'UNKNOWN',
          engagementRatePercent: null,
        },
      };
    }

    const overview = await LinkedInService.getOverviewAnalytics(userId);
    const postData = await LinkedInService.getPostAnalytics(userId);

    // If Community Management API is not enabled for analytics
    if (!overview.analyticsAvailable) {
      return {
        connected: true,
        analyticsAvailable: false,
        overallHealthScore: 75,
        summary: `Connected as ${status.member?.name || 'LinkedIn Member'}. Basic publishing and OpenID authentication are operational. Advanced member analytics require LinkedIn Community Management approval.`,
        insights: [
          {
            type: 'POSITIVE',
            title: 'Publishing Engine Operational',
            description: 'Your ROXTEN OS agents can automatically compose and publish posts to your personal LinkedIn feed using w_member_social.',
          },
          {
            type: 'INFO',
            title: 'Analytics Permissions',
            description: 'Follower and impression statistics require r_member_profileAnalytics permission on your LinkedIn Developer App.',
          },
          {
            type: 'TIP',
            title: 'Content Recommendation',
            description: 'Post at peak business hours (Tuesday–Thursday 8 AM–10 AM) to maximize reach among your professional network.',
          },
        ],
        topPost: null,
        lowestPost: null,
        trends: {
          followerTrend: 'UNKNOWN',
          engagementRatePercent: null,
        },
      };
    }

    // Historical snapshots
    let snapshots: LinkedInDailySnapshot[] = [];
    try {
      snapshots = await prisma.linkedInSnapshot.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30,
      });
    } catch {}

    const posts = postData.posts || [];
    let topPost: LinkedInPostAnalyticsItem | null = null;
    let lowestPost: LinkedInPostAnalyticsItem | null = null;

    if (posts.length > 0) {
      const sortedByImpressions = [...posts].sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
      topPost = sortedByImpressions[0] || null;
      lowestPost = sortedByImpressions[sortedByImpressions.length - 1] || null;
    }

    // Compute Engagement Rate
    let totalImpressions = 0;
    let totalEngagements = 0;
    posts.forEach((p) => {
      totalImpressions += p.impressions || 0;
      totalEngagements += (p.reactions || 0) + (p.comments || 0) + (p.reshares || 0);
    });

    const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : null;

    const insights: GrowthInsight[] = [];

    // Evaluate trends
    let followerTrend: 'GROWING' | 'STABLE' | 'DECLINING' | 'UNKNOWN' = 'STABLE';
    if (snapshots.length >= 2) {
      const latest = snapshots[0].followers || 0;
      const prev = snapshots[snapshots.length - 1].followers || 0;
      if (latest > prev) followerTrend = 'GROWING';
      else if (latest < prev) followerTrend = 'DECLINING';
    }

    if (followerTrend === 'GROWING') {
      insights.push({
        type: 'POSITIVE',
        title: 'Audience Expanding',
        description: 'Your follower count is increasing over the recent snapshot period.',
        metric: `+${(snapshots[0]?.followers || 0) - (snapshots[snapshots.length - 1]?.followers || 0)} followers`,
      });
    }

    if (engagementRate !== null) {
      if (engagementRate > 3.0) {
        insights.push({
          type: 'POSITIVE',
          title: 'Strong Engagement Rate',
          description: `Your average engagement rate is ${engagementRate.toFixed(1)}%, beating the LinkedIn industry benchmark of 2%.`,
          metric: `${engagementRate.toFixed(1)}%`,
        });
      } else {
        insights.push({
          type: 'TIP',
          title: 'Boost Engagement with Questions',
          description: 'Try ending posts with open-ended conversation starters to stimulate comments and expand algorithmic reach.',
          metric: `${engagementRate.toFixed(1)}%`,
        });
      }
    }

    insights.push({
      type: 'INFO',
      title: 'Agent Optimization',
      description: 'Roxten OS marketing agents are synced with your LinkedIn feed and ready to generate thought-leadership drafts.',
    });

    const overallHealthScore = Math.min(100, Math.max(50, 70 + (engagementRate ? Math.round(engagementRate * 5) : 10)));

    return {
      connected: true,
      analyticsAvailable: true,
      overallHealthScore,
      summary: `LinkedIn growth report: ${posts.length} posts analyzed. Overall engagement is healthy at ${engagementRate ? engagementRate.toFixed(1) + '%' : 'N/A'}.`,
      insights,
      topPost,
      lowestPost,
      trends: {
        followerTrend,
        engagementRatePercent: engagementRate ? Math.round(engagementRate * 10) / 10 : null,
      },
    };
  }
}
