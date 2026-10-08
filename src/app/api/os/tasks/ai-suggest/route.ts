import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const [tasks, employees, departments] = await Promise.all([
      prisma.task.findMany({ where: { businessId: business.id, status: { not: 'COMPLETED' } }, take: 100 }),
      prisma.employee.findMany({ where: { businessId: business.id } }),
      prisma.department.findMany({ where: { businessId: business.id } })
    ]);

    if (tasks.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const llm = new GroqProvider();
    
    // Create an anonymized/compressed summary of tasks and workload
    const workload = employees.map((e: any) => ({
      name: e.name,
      role: e.role,
      tasks: tasks.filter((t: any) => t.employeeId === e.id).map((t: any) => ({ title: t.title, priority: t.priority, status: t.status }))
    }));
    const unassigned = tasks.filter((t: any) => !t.employeeId).map((t: any) => ({ title: t.title, priority: t.priority }));

    const prompt = `You are an AI Operational Manager for ${business.name}.
Analyze the following active task backlog and employee workload.

WORKLOAD:
${JSON.stringify(workload)}

UNASSIGNED TASKS:
${JSON.stringify(unassigned)}

Your job is to identify operational bottlenecks, overloaded employees, duplicate tasks, or missing assignments.
Return ONLY a valid JSON array of objects representing your recommendations. Use this exact structure:
[
  {
    "type": "reassign" | "priority_shift" | "blocker_warning" | "efficiency",
    "title": "Short title",
    "description": "Specific, actionable reason and instruction.",
    "affectedTaskId": "string (optional)",
    "suggestedEmployee": "string (optional)"
  }
]
If operations are optimal, return an empty array []. Do not include markdown formatting.`;

    const rawResponse = await llm.generateText(prompt, { temperature: 0.2 });
    let recommendations: any[] = [];
    try {
      const match = rawResponse.match(/\[[\s\S]*\]/);
      if (match) {
        recommendations = JSON.parse(match[0]);
      } else {
        recommendations = JSON.parse(rawResponse);
      }
    } catch (e) {
      console.error('Failed to parse AI suggestions', rawResponse);
    }

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
