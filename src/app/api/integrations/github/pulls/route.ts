import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GitHubService } from '@/lib/integrations/services/GitHubService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const url = new URL(req.url);
    const owner = url.searchParams.get('owner');
    const repo = url.searchParams.get('repo');
    const state = (url.searchParams.get('state') as any) || 'open';

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Query parameters "owner" and "repo" are required.' },
        { status: 400 }
      );
    }

    const pulls = await GitHubService.listPullRequests(userId, owner, repo, state);
    return NextResponse.json({ success: true, pulls });
  } catch (error: any) {
    console.error('GitHub pulls error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch GitHub pull requests' },
      { status: 500 }
    );
  }
}
