import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    
    // Validate we own the report
    const report = await prisma.businessReport.findUnique({ where: { id } });
    if (!report || report.businessId !== businessId) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    if (format === 'csv') {
      // Flatten simple fields to CSV
      const rows: any[][] = [];
      rows.push(['Report ID', report.id]);
      rows.push(['Generated At', report.createdAt]);
      rows.push(['Type', report.type]);
      rows.push(['Timeframe', report.timeframe]);
      rows.push(['Period Start', report.periodStart]);
      rows.push(['Period End', report.periodEnd]);
      rows.push([]);
      
      rows.push(['Executive Summary']);
      rows.push([report.summary]);
      rows.push([]);
      
      if (report.metricsSnapshot) {
        rows.push(['METRICS']);
        const metrics = typeof report.metricsSnapshot === 'string' ? JSON.parse(report.metricsSnapshot) : report.metricsSnapshot;
        
        if (metrics.tasks) {
          rows.push(['TASKS']);
          rows.push(['Total', metrics.tasks.total]);
          rows.push(['Created In Period', metrics.tasks.createdInPeriod]);
          rows.push(['Completed', metrics.tasks.completedTotal]);
          rows.push(['Completion Rate', metrics.tasks.completionRate + '%']);
          rows.push([]);
        }
        
        if (metrics.workforce) {
          rows.push(['WORKFORCE']);
          rows.push(['Total', metrics.workforce.total]);
          rows.push(['AI Agents', metrics.workforce.aiCount]);
          rows.push(['Humans', metrics.workforce.humanCount]);
          rows.push(['AI Utilization', metrics.workforce.aiUtilization + '%']);
          rows.push([]);
        }

        if (metrics.knowledge) {
          rows.push(['KNOWLEDGE']);
          rows.push(['Total Documents', metrics.knowledge.totalDocuments]);
          rows.push(['Extracted Facts', metrics.knowledge.totalIntelligenceFacts]);
          rows.push(['Brain Insights', metrics.knowledge.totalBrainInsights]);
          rows.push([]);
        }
      }

      if (report.highlights && report.highlights.length > 0) {
        rows.push(['Highlights']);
        report.highlights.forEach((h: string) => rows.push([h]));
        rows.push([]);
      }

      if (report.risks && report.risks.length > 0) {
        rows.push(['Risks']);
        report.risks.forEach((r: string) => rows.push([r]));
        rows.push([]);
      }
      
      if (report.opportunities && report.opportunities.length > 0) {
        rows.push(['Opportunities']);
        report.opportunities.forEach((o: string) => rows.push([o]));
        rows.push([]);
      }

      if (report.recommendations && report.recommendations.length > 0) {
        rows.push(['Recommendations']);
        report.recommendations.forEach((r: string) => rows.push([r]));
        rows.push([]);
      }

      const csvString = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

      return new NextResponse(csvString, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report_${id}.csv"`
        }
      });
    }

    // Default JSON
    return new NextResponse(JSON.stringify(report, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="report_${id}.json"`
      }
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
