import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const [tasks, events, employees, memories] = await Promise.all([
      prisma.task.findMany({
        where: { businessId: business.id, status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] } },
        take: 30
      }),
      prisma.businessTimelineEvent.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 30
      }),
      prisma.employee.findMany({
        where: { businessId: business.id },
        include: { department: true }
      }),
      prisma.memory.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    if (tasks.length === 0 && events.length === 0 && employees.length === 0) {
      return NextResponse.json({ success: true, insights: [] });
    }

    const llm = new GroqProvider();
    const prompt = `You are the Company Brain (Operating Intelligence), acting as the COO of ${business.name}.
Your job is to constantly analyze operations, find bottlenecks, evaluate workload, and proactively surface recommendations.

Here is the current state of the company:
[EMPLOYEES] (Assess workload and idle status):
${JSON.stringify(employees.map(e => ({ name: e.name, role: e.role, dept: e.department?.name })))}

[ACTIVE TASKS] (Look for duplicates, blockers, or overloaded departments):
${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, assignedTo: employees.find(e => e.id === t.employeeId)?.name || 'Unassigned' })))}

[RECENT EVENTS] (Look for trends, failures, or successes):
${JSON.stringify(events.map(e => ({ type: e.type, title: e.title, description: e.description })))}

[RECENT MEMORIES / LEARNINGS]:
${JSON.stringify(memories.map(m => ({ key: m.key, value: m.value })))}

Analyze this data and return ONLY a valid JSON array of objects with this exact structure:
[
  { 
    "type": "Risk" | "Opportunity" | "Duplicate" | "Bottleneck" | "Recommendation", 
    "title": "Short Executive Title", 
    "description": "2-3 sentences explaining the issue/opportunity and proposing a specific actionable solution."
  }
]
If operations are flawless and no insights are needed, return an empty array []. Do NOT include markdown.`;

    const rawResponse = await llm.generateText(prompt, { temperature: 0.3 });
    let insights: any[] = [];
    try {
      const match = rawResponse.match(/\[[\s\S]*\]/);
      if (match) {
        insights = JSON.parse(match[0]);
      } else {
        insights = JSON.parse(rawResponse);
      }
    } catch (e) {
      console.error('Failed to parse brain insights', rawResponse);
    }

    const createdInsights: any[] = [];
    for (const insight of insights) {
      if (!insight.title || !insight.description) continue;
      
      // Prevent duplicate insights
      const existing = await prisma.businessInsight.findFirst({
        where: { businessId: business.id, title: insight.title }
      });
      
      if (!existing) {
        const created = await prisma.businessInsight.create({
          data: {
            businessId: business.id,
            type: insight.type || 'Opportunity',
            title: insight.title,
            description: insight.description,
            status: 'PENDING',
            updatedAt: new Date()
          }
        });
        createdInsights.push(created);
      }
    }

    return NextResponse.json({ success: true, insights: createdInsights });
  } catch (error: any) {
    console.error('Brain Analyze Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
