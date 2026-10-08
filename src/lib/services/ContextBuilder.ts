import prisma from '@/lib/prisma';
import { IntelligenceService } from './IntelligenceService';

export class ContextBuilder {
  /**
   * Constructs the full operational context for an AI employee or agent.
   * This ensures the AI isn't just a generic LLM, but grounded in real company data.
   */
  static async buildAIContext(businessId: string, employeeId: string | null): Promise<string> {
    let contextParts: string[] = [];

    // 1. Company Brain (Global rules, identity, mission)
    try {
      const company = await prisma.business.findUnique({ where: { id: businessId } });
      if (company) {
        contextParts.push(`COMPANY IDENTITY:\nName: ${company.name}\nIndustry: ${company.industry}\n`);
      }
      
      const dna = await IntelligenceService.getCompanyDNA(businessId);
      if (dna) {
        contextParts.push(`COMPANY DNA (Core Values & Strategy):\n${dna.identity}\n${dna.strategy}\n`);
      }

      // Fetch active business insights
      const insights = await prisma.businessInsight.findMany({ where: { businessId } });
      if (insights.length > 0) {
        const activeInsights = insights.slice(0, 10).map((i: any) => `- ${i.fact}`).join('\n');
        contextParts.push(`RECENT BUSINESS INSIGHTS:\n${activeInsights}\n`);
      }

    } catch (e) {
      console.error('Error fetching company context', e);
    }

    // 2. Employee Specific Context (Role, Department, Memory)
    if (employeeId && employeeId !== 'general') {
      try {
        const employee = await prisma.employee.findUnique({
          where: { id: employeeId },
          include: { department: true }
        });

        if (employee) {
          contextParts.push(`YOUR IDENTITY:\nYou are ${employee.name}, acting as ${employee.role}.`);
          contextParts.push(`Personality: ${employee.personality || 'Professional, concise, and highly competent.'}`);
          
          if (employee.department) {
            contextParts.push(`DEPARTMENT: ${employee.department.name}\nMission: ${employee.department.mission}`);
          }

          if (employee.rules && employee.rules.length > 0) {
            contextParts.push(`YOUR OPERATIONAL RULES:\n${employee.rules.map((r: string) => `- ${r}`).join('\n')}`);
          }

          // Fetch knowledge specific to this employee's tags (if any)
          if (employee.knowledgeAccessTags && employee.knowledgeAccessTags.length > 0) {
            const kbDocs = await prisma.knowledgeDocument.findMany({ where: { businessId } });
            const relevantDocs = kbDocs.filter((d: any) => 
              d.tags?.some((t: string) => employee.knowledgeAccessTags.includes(t))
            );
            
            if (relevantDocs.length > 0) {
              const summaries = relevantDocs.slice(0, 3).map((d: any) => `${d.title}: ${d.aiSummary}`).join('\n');
              contextParts.push(`RELEVANT KNOWLEDGE BASE CONTEXT:\n${summaries}`);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching employee context', e);
      }
    } else {
      contextParts.push(`YOUR IDENTITY:\nYou are a highly competent general AI assistant operating within the organization.`);
    }

    // 3. Recent Global Timeline Events (What just happened?)
    try {
      const recentEvents = await prisma.businessTimelineEvent.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' }
      });
      // Just take the top 5 events so they know what's happening
      if (recentEvents.length > 0) {
        const eventStrs = recentEvents.slice(0, 5).map((e: any) => `- ${e.actor}: ${e.title} (${e.eventType})`);
        contextParts.push(`RECENT GLOBAL EVENTS (For Awareness):\n${eventStrs.join('\n')}`);
      }
    } catch (e) {
      console.error('Error fetching events context', e);
    }

    return contextParts.join('\n\n');
  }
}
