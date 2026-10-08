import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LinkedInService } from '@/lib/integrations/services/LinkedInService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const status = await LinkedInService.getStatus(userId);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Failed to get LinkedIn status:', error);
    return NextResponse.json(
      {
        connected: false,
        state: 'DISCONNECTED',
        capabilities: {
          profile: false,
          publish: false,
          followerAnalytics: false,
          postAnalytics: false,
        },
        error: error.message,
      },
      { status: 500 }
    );
  }
}
