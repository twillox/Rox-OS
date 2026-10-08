import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LinkedInGrowthAnalyst } from '@/lib/integrations/linkedin/LinkedInGrowthAnalyst';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const report = await LinkedInGrowthAnalyst.analyzeGrowth(userId);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('LinkedIn growth analyst error:', error);
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
