import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { LinkedInProvider } from '@/lib/integrations/providers/LinkedInProvider';

import { getBaseUrl } from '@/lib/utils/url';

export async function GET(req: Request) {
  try {
    const baseUrl = getBaseUrl(req);
    const provider = new LinkedInProvider();
    const clientId = provider.getClientId();
    const clientSecret = provider.getClientSecret();
    const redirectUri = provider.getRedirectUri(baseUrl);

    // Strict validation: return standard missing configuration response
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
