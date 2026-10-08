import { GroqProvider } from '@/core/providers/GroqProvider';
import { EventService } from '@/lib/services/EventService';
import prisma from '@/lib/prisma';

export class ReportService {
  /**
   * Generates a deterministic snapshot report.
   * Pulls metrics, sends to LLM for narrative summary, and persists.
   */
  static async generateReport(businessId: string, timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY', requestedBy: string = 'System') {
    
    // 1. Calculate Date Range
    const now = new Date();
    let startDate = new Date();
    if (timeframe === 'DAILY') startDate.setDate(now.getDate() - 1);
    else if (timeframe === 'WEEKLY') startDate.setDate(now.getDate() - 7);
    else if (timeframe === 'MONTHLY') startDate.setMonth(now.getMonth() - 1);
    
    const isoStart = startDate.toISOString();

    // 2. Aggregate Live Deterministic Metrics (Composition)
    
    // Tasks
    const allTasks = await prisma.task.findMany({ where: { businessId } });
    const tasksInPeriod = allTasks.filter((t: any) => t.createdAt >= isoStart);
    const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'DONE');
    
    const taskMetrics = {
      total: allTasks.length,
      createdInPeriod: tasksInPeriod.length,
      completedTotal: completedTasks.length,
      completionRate: allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0
    };

    // Workforce
    const employees = await prisma.employee.findMany({ where: { businessId } });
    const aiEmployees = employees.filter((e: any) => e.type === 'AI' || e.isAi === true);
    
    const workforceMetrics = {
      total: employees.length,
      aiCount: aiEmployees.length,
      humanCount: employees.length - aiEmployees.length,
      aiUtilization: employees.length > 0 ? Math.round((aiEmployees.length / employees.length) * 100) : 0
    };

    // Departments
    const departments = await prisma.department.findMany({ where: { businessId } });
    
    // Knowledge Base (Documents) & Company Brain (Insights)
    const kbItems = await prisma.knowledgeDocument.findMany({ where: { businessId } });
    const docs = kbItems.filter((d: any) => d.type !== 'INTELLIGENCE');
    const intelligence = kbItems.filter((d: any) => d.type === 'INTELLIGENCE');
    const brainInsights = await prisma.businessInsight.findMany({ where: { businessId } });
    
    const knowledgeMetrics = {
      totalDocuments: docs.length,
      totalIntelligenceFacts: intelligence.length,
      totalBrainInsights: brainInsights.length
    };

    // Timeline Events
    const events = await prisma.businessTimelineEvent.findMany({ where: { businessId } });
    const recentEvents = events
      .filter((e: any) => e.createdAt >= isoStart)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); // Top 10 recent events

    const snapshotData = {
      period: { start: isoStart, end: now.toISOString(), type: timeframe },
      tasks: taskMetrics,
      workforce: workforceMetrics,
      departments: { total: departments.length },
      knowledge: knowledgeMetrics,
      recentEvents: recentEvents.map((e: any) => ({ type: e.type, message: e.message || e.title, date: e.createdAt }))
    };

    // 3. Send deterministic metrics to LLM to generate narrative (Summary, Risks, Recommendations)
    const llm = new GroqProvider();
    const systemPrompt = `You are a Chief of Staff AI analyzing a snapshot of organizational metrics.
Do NOT invent numbers. Use strictly the metrics provided. Focus on interpretation, operational bottlenecks, knowledge gaps, and strategic recommendations. Avoid generic motivational text.

METRICS SNAPSHOT:
${JSON.stringify(snapshotData, null, 2)}`;

    const jsonSchema = {
      type: "object",
      properties: {
        executiveSummary: { type: "string", description: "A high-level business health narrative." },
        risks: { type: "array", items: { type: "string" }, description: "Detected risks based on the data." },
        opportunities: { type: "array", items: { type: "string" }, description: "Strategic opportunities." },
        recommendations: { type: "array", items: { type: "string" }, description: "Actionable next steps." },
        highlights: { type: "array", items: { type: "string" }, description: "3-4 bullet points of major positive metrics." }
      }
    };

    const parsedData = await llm.generateJSON(systemPrompt, jsonSchema) as any;

    // 4. Persist the Immutable Report Snapshot
    const reportId = `rep_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const reportData = {
      id: reportId,
      businessId,
      type: 'Executive',
      timeframe,
      periodStart: isoStart,
      periodEnd: now.toISOString(),
      generatedBy: requestedBy,
      metricsSnapshot: JSON.parse(JSON.stringify(snapshotData)), // Strip undefined
      summary: parsedData.executiveSummary || 'Report generated successfully.',
      highlights: parsedData.highlights || [],
      risks: parsedData.risks || [],
      opportunities: parsedData.opportunities || [],
      recommendations: parsedData.recommendations || [],
      status: 'PUBLISHED'
    };

    let savedReport = null;
    try {
      savedReport = await prisma.businessReport.create({
        data: reportData
      });
    } catch (e) {
      console.warn('Could not persist businessReport record, using fallback', e);
    }

    const finalReport = savedReport || reportData;

    // 5. Publish to Timeline
    try {
      await EventService.publish({
        businessId,
        module: 'REPORTS',
        eventType: 'REPORT_GENERATED',
        title: 'Executive Report Generated',
        description: `A new ${timeframe.toLowerCase()} executive report was generated.`,
        actor: requestedBy,
        metadata: { reportId: finalReport.id }
      });
    } catch (e) {}

    return finalReport;
  }
}
