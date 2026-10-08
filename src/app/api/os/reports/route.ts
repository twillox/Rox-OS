import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    let rawReports = await prisma.businessReport.findMany({
      where: { businessId: business.id }
    });

    if (!rawReports || rawReports.length === 0) {
      try {
        const { ReportService } = await import('@/lib/services/ReportService');
        const rep = await ReportService.generateReport(business.id, 'WEEKLY', 'CEO');
        rawReports = [rep];
      } catch (e) {
        rawReports = [];
      }
    }

    // Sort in memory to avoid missing Firestore composite index error
    const reports = rawReports.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // descending
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const { timeframe } = await req.json();
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const userId = cookieStore.get('userId')?.value || 'System';

    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const { ReportService } = await import('@/lib/services/ReportService');
    const report = await ReportService.generateReport(business.id, timeframe || 'WEEKLY', userId);

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
