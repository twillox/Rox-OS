import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LinkedInService } from '@/lib/integrations/services/LinkedInService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30d';

    const analytics = await LinkedInService.getOverviewAnalytics(userId, period);
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('LinkedIn overview analytics error:', error);
    return NextResponse.json(
      {
        connected: false,
        analyticsAvailable: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
