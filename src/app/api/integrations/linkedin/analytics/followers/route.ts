import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LinkedInService } from '@/lib/integrations/services/LinkedInService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '7d';

    const analytics = await LinkedInService.getFollowerAnalytics(userId, period);
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('LinkedIn follower analytics error:', error);
    return NextResponse.json(
      {
        currentFollowers: null,
        followersGained: null,
        period: '7d',
        data: [],
        analyticsAvailable: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
