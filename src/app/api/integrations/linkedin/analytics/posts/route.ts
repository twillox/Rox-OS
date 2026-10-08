import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LinkedInService } from '@/lib/integrations/services/LinkedInService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const analytics = await LinkedInService.getPostAnalytics(userId);
    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('LinkedIn post analytics error:', error);
    return NextResponse.json(
      {
        posts: [],
        analyticsAvailable: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}
