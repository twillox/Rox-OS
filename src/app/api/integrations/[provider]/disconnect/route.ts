import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IntegrationService } from '@/lib/integrations/IntegrationService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    await IntegrationService.disconnectIntegration(userId, rawProvider);

    return NextResponse.json({
      success: true,
      message: `Integration ${rawProvider} has been disconnected.`,
    });
  } catch (error: any) {
    console.error('Failed to disconnect integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
