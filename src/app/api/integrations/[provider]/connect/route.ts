import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { IntegrationService } from '@/lib/integrations/IntegrationService';

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params;
    const url = new URL(req.url);
    const serviceQuery = url.searchParams.get('service');

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const baseUrl = getBaseUrl(req);
    const { provider, serviceSubtype } = IntegrationService.getProviderInstance(rawProvider);
    const effectiveService = serviceQuery || serviceSubtype;

    // Generate secure state token
    const stateNonce = crypto.randomBytes(24).toString('hex');
    const statePayload = JSON.stringify({
      nonce: stateNonce,
      userId,
      provider: provider.providerId,
      requestedKey: rawProvider,
      service: effectiveService,
      timestamp: Date.now(),
    });

    const encodedState = Buffer.from(statePayload).toString('base64url');

    let authUrl: string;
    try {
      authUrl = provider.getAuthorizationUrl(userId, encodedState, {
        service: effectiveService,
        baseUrl,
      });
    } catch (configError: any) {
      console.warn(`OAuth configuration warning for ${rawProvider}:`, configError.message);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(configError.message + ' Open your .env file to configure credentials.')}`
      );
    }

    const response = NextResponse.redirect(authUrl);

    // Save state in cookie for callback validation
    response.cookies.set(`oauth_state_${provider.providerId}`, stateNonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error('OAuth connect error:', error);
    const baseUrl = getBaseUrl(req);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(error.message || 'Failed to initiate OAuth flow')}`
    );
  }
}
