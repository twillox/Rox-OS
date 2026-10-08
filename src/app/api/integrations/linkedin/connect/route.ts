import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { LinkedInProvider } from '@/lib/integrations/providers/LinkedInProvider';

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    // Strict validation as specified: return standard missing configuration response
    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        {
          success: false,
          code: 'LINKEDIN_CONFIGURATION_MISSING',
          message: 'LinkedIn OAuth is not configured on the server.',
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
    const baseUrl = getBaseUrl(req);

    const provider = new LinkedInProvider();

    // Generate secure cryptographically random state
    const stateNonce = crypto.randomBytes(24).toString('hex');
    const statePayload = JSON.stringify({
      nonce: stateNonce,
      userId,
      provider: 'linkedin',
      requestedKey: 'linkedin',
      timestamp: Date.now(),
    });

    const encodedState = Buffer.from(statePayload).toString('base64url');

    const authUrl = provider.getAuthorizationUrl(userId, encodedState, {
      baseUrl,
      scopes: ['openid', 'profile', 'email', 'w_member_social'],
    });

    const response = NextResponse.redirect(authUrl);

    // Save state nonce in httpOnly cookie for CSRF verification on callback
    response.cookies.set('oauth_state_linkedin', stateNonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error('LinkedIn OAuth connect initiation error:', error);
    const baseUrl = getBaseUrl(req);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(error.message || 'Failed to initiate LinkedIn OAuth')}`
    );
  }
}
