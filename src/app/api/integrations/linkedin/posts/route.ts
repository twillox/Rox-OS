import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LinkedInService } from '@/lib/integrations/services/LinkedInService';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const body = await req.json();
    const text = body.text;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'Post commentary text is required.' },
        { status: 400 }
      );
    }

    const result = await LinkedInService.createPost(userId, { text: text.trim() });
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('LinkedIn createPost route error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: error.message || 'Failed to publish LinkedIn post.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const analytics = await LinkedInService.getPostAnalytics(userId);
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
