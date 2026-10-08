import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GitHubService } from '@/lib/integrations/services/GitHubService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const url = new URL(req.url);
    const perPage = parseInt(url.searchParams.get('per_page') || '30', 10);

    const repos = await GitHubService.listRepositories(userId, perPage);
    return NextResponse.json({ success: true, repos });
  } catch (error: any) {
    console.error('GitHub repos error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch GitHub repositories' },
      { status: 500 }
    );
  }
}
