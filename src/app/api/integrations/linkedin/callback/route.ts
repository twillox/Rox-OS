import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LinkedInProvider } from '@/lib/integrations/providers/LinkedInProvider';
import { IntegrationService } from '@/lib/integrations/IntegrationService';
import { EventPipeline } from '@/core/messaging/EventPipeline';

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const baseUrl = getBaseUrl(req);

  try {
    const url = new URL(req.url);

    // 1. Check for error parameters returned from LinkedIn
    const errorParam = url.searchParams.get('error') || url.searchParams.get('error_description');
    if (errorParam) {
      console.warn('LinkedIn reported error in callback:', errorParam);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(`LinkedIn error: ${errorParam}`)}`
      );
    }

    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=${encodeURIComponent('No authorization code received from LinkedIn.')}`
      );
    }

    // 2. Validate CSRF state
    const cookieStore = await cookies();
    const storedStateNonce = cookieStore.get('oauth_state_linkedin')?.value;

    let parsedState: any = {};
    if (stateParam) {
      try {
        const decoded = Buffer.from(stateParam, 'base64url').toString('utf8');
        parsedState = JSON.parse(decoded);
      } catch {
        parsedState = { nonce: stateParam };
      }
    }

    if (storedStateNonce && parsedState.nonce && storedStateNonce !== parsedState.nonce) {
      console.error('LinkedIn CSRF state mismatch:', { storedStateNonce, received: parsedState.nonce });
      return NextResponse.redirect(
        `${baseUrl}/dashboard/integrations?error=${encodeURIComponent('Invalid OAuth state parameter. Please try connecting again.')}`
      );
    }

    // 3. Resolve user identity from state or cookies (never hardcoded)
    const userId = parsedState.userId || cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';

    // 4. Exchange code for access token & fetch user profile
    const provider = new LinkedInProvider();
    const callbackResult = await provider.handleCallback(code, stateParam || undefined, baseUrl);

    // 5. Encrypt and store tokens in database
    await IntegrationService.saveOAuthConnection(userId, businessId, 'linkedin', callbackResult);

    // 6. Notify event pipeline
    try {
      EventPipeline.getInstance().dispatch({
        type: 'SYSTEM_LOG',
        sender: 'LinkedInProvider',
        receiver: 'all',
        intent: 'LINKEDIN_CONNECTED',
        payload: {
          userId,
          memberId: callbackResult.profile.providerAccountId,
          memberName: callbackResult.profile.providerAccountName,
        },
        priority: 'high',
        status: 'completed',
      });
    } catch {}

    console.log(`LinkedIn OAuth successfully completed for user ${userId} (${callbackResult.profile.providerAccountName})`);

    // 7. Cleanup state cookie and redirect back to Integrations Hub
    const response = NextResponse.redirect(`${baseUrl}/dashboard/integrations?connected=linkedin`);
    response.cookies.delete('oauth_state_linkedin');
    return response;
  } catch (error: any) {
    console.error('LinkedIn OAuth callback handling error:', error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/integrations?error=${encodeURIComponent(error.message || 'Failed to complete LinkedIn connection.')}`
    );
  }
}
