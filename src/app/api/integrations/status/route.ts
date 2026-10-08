import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IntegrationService } from '@/lib/integrations/IntegrationService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const userIntegrations = await IntegrationService.listPublicUserIntegrations(userId);

    return NextResponse.json({
      success: true,
      integrations: userIntegrations,
    });
  } catch (error: any) {
    console.error('Failed to list integrations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve integration status' },
      { status: 500 }
    );
  }
}
