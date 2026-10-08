import prisma from '@/lib/prisma';
import { ContextBuilder } from './ContextBuilder';

export class ExecutiveContextBuilder {
  /**
   * Constructs an overarching executive context for Boardroom meetings.
   * This builds on top of the standard AI context and adds overarching strategic data
   * like recent Decisions and Executive Reports.
   */
  static async buildExecutiveContext(businessId: string, employeeId: string | null): Promise<string> {
    const baseContext = await ContextBuilder.buildAIContext(businessId, employeeId);
    let execParts: string[] = [];

    // 1. Executive Reports
    try {
      const reports = await prisma.businessReport.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
      });
      if (reports.length > 0) {
        // Just take the latest report to avoid token bloat
        const latestReport = reports[0];
        execParts.push(`LATEST EXECUTIVE REPORT:\nType: ${latestReport.type}\nSummary: ${latestReport.summary}\nRisks: ${latestReport.risks}\n`);
      }
    } catch (e) {
      console.error('Error fetching reports context', e);
    }

    // 2. Recent Decisions
    try {
      const decisions = await prisma.boardroomDecision.findMany({
        where: { businessId, status: { in: ['APPROVED', 'IMPLEMENTED'] } },
        orderBy: { createdAt: 'desc' }
      });
      if (decisions.length > 0) {
        const decStrs = decisions.slice(0, 5).map((d: any) => `- ${d.title} (${d.status})`);
        execParts.push(`RECENT EXECUTIVE DECISIONS:\n${decStrs.join('\n')}\n`);
      }
    } catch (e) {
      console.error('Error fetching decisions context', e);
    }

    return `${baseContext}\n\n[EXECUTIVE STRATEGY CONTEXT]\n${execParts.join('\n')}`;
  }
}
