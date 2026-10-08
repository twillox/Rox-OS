export type LinkedInConnectionState = 
  | 'CONNECTED' 
  | 'CONNECTED_WITH_ANALYTICS' 
  | 'CONNECTED_WITHOUT_ANALYTICS' 
  | 'DISCONNECTED'
  | 'ERROR';

export interface LinkedInCapabilities {
  profile: boolean;
  publish: boolean;
  followerAnalytics: boolean;
  postAnalytics: boolean;
}

export interface LinkedInStatusResponse {
  connected: boolean;
  state: LinkedInConnectionState;
  capabilities: LinkedInCapabilities;
  member?: {
    id: string;
    name: string;
    avatarUrl?: string;
    email?: string;
    connectedAt?: string;
  };
  scopes: string[];
}

export interface LinkedInPostRequest {
  text: string;
}

export interface LinkedInPostResponse {
  success: boolean;
  postId?: string;
  url?: string;
  code?: string;
  message?: string;
}

export interface FollowerDataPoint {
  date: string;
  followers: number;
}

export interface LinkedInFollowerAnalytics {
  currentFollowers: number | null;
  followersGained: number | null;
  period: string;
  data: FollowerDataPoint[];
  analyticsAvailable: boolean;
  message?: string;
}

export interface LinkedInPostAnalyticsItem {
  id: string;
  text?: string;
  createdAt?: string;
  impressions: number | null;
  reach: number | null;
  reactions: number | null;
  comments: number | null;
  reshares: number | null;
  saves: number | null;
  linkClicks: number | null;
  followersGained: number | null;
  profileViews: number | null;
}

export interface LinkedInPostsAnalyticsResponse {
  posts: LinkedInPostAnalyticsItem[];
  analyticsAvailable: boolean;
  message?: string;
}

export interface LinkedInOverviewAnalytics {
  connected: boolean;
  analyticsAvailable: boolean;
  capabilities: LinkedInCapabilities;
  member?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  followers: {
    current: number | null;
    changeToday: number | null;
    change7d: number | null;
    change30d: number | null;
  };
  content: {
    posts: number | null;
    impressions: number | null;
    reach: number | null;
    reactions: number | null;
    comments: number | null;
    reshares: number | null;
  };
  topPosts: LinkedInPostAnalyticsItem[];
  period: string;
  message?: string;
}

export interface LinkedInDailySnapshot {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  followers: number | null;
  impressions: number | null;
  reactions: number | null;
  comments: number | null;
  reshares: number | null;
  reach: number | null;
  createdAt: string;
}
