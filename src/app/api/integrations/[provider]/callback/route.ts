import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { IntegrationService } from '@/lib/integrations/IntegrationService';

import { getBaseUrl } from '@/lib/utils/url';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const baseUrl = getBaseUrl(req);

  try {
    const { provider: rawProvider } = await params;
    const url = new URL(req.url);

    const errorParam = url.searchParams.get('error') || url.searchParams.get('error_description');
    if (errorParam) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(`Provider reported error: ${errorParam}`)}`
      );
    }

    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=${encodeURIComponent('No authorization code provided by provider')}`
      );
    }

    // 1. Resolve provider
    const { provider } = IntegrationService.getProviderInstance(rawProvider);

    // 2. State verification
    const cookieStore = await cookies();
    const storedStateNonce = cookieStore.get(`oauth_state_${provider.providerId}`)?.value;

    let parsedState: any = {};
    if (stateParam) {
      try {
        const decoded = Buffer.from(stateParam, 'base64url').toString('utf8');
        parsedState = JSON.parse(decoded);
      } catch {
        // Fallback if state is raw string
        parsedState = { nonce: stateParam };
      }
    }

    if (storedStateNonce && parsedState.nonce && storedStateNonce !== parsedState.nonce) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=${encodeURIComponent('Invalid OAuth state parameter (CSRF detected)')}`
      );
    }

    // Resolve userId & businessId
    const userId = parsedState.userId || cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const targetKey = parsedState.requestedKey || rawProvider;

    // 3. Exchange code for credentials
    const callbackResult = await provider.handleCallback(code, stateParam || undefined, baseUrl);

    // 4. Save encrypted integration in database
    await IntegrationService.saveOAuthConnection(userId, businessId, targetKey, callbackResult);

    console.log(`${provider.providerId} OAuth completed for user ${userId}`);

    // 5. Cleanup state cookie and redirect back to integrations hub
    const cardId = IntegrationService.toCardId(targetKey);
    const response = NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?connected=${encodeURIComponent(cardId)}`
    );

    response.cookies.delete(`oauth_state_${provider.providerId}`);
    return response;
  } catch (error: any) {
    console.error('OAuth callback processing error:', error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(error.message || 'Failed to complete OAuth connection')}`
    );
  }
}
