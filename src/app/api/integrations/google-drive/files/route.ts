import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleDriveService } from '@/lib/integrations/services/GoogleDriveService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const pageToken = url.searchParams.get('pageToken') || undefined;

    if (q) {
      const files = await GoogleDriveService.searchFiles(userId, q, pageSize);
      return NextResponse.json({ success: true, files });
    } else {
      const result = await GoogleDriveService.listFiles(userId, pageSize, pageToken);
      return NextResponse.json({ success: true, ...result });
    }
  } catch (error: any) {
    console.error('Google Drive files API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to access Google Drive' },
      { status: 500 }
    );
  }
}
