import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IntegrationService } from '@/lib/integrations/IntegrationService';

export async function POST(req: Request) {
  return handleDisconnect();
}

export async function DELETE(req: Request) {
  return handleDisconnect();
}

async function handleDisconnect() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    await IntegrationService.disconnectIntegration(userId, 'linkedin');

    return NextResponse.json({
      success: true,
      message: 'LinkedIn integration has been disconnected and credentials cleared.',
    });
  } catch (error: any) {
    console.error('Failed to disconnect LinkedIn:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect LinkedIn integration' },
      { status: 500 }
    );
  }
}
