import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WorkforceService } from '@/lib/services/WorkforceService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    let urgentCallInitiation: any = null;

    // Find a pending or active task to make progress on
    const activeTask = await prisma.task.findFirst({
      where: { businessId: business.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      include: { employee: true }
    });

    if (activeTask && activeTask.employee) {
      // Transition to IN_PROGRESS if pending
      if (activeTask.status === 'PENDING') {
        await prisma.task.update({ where: { id: activeTask.id }, data: { status: 'IN_PROGRESS' } });
      }

      // ACTUALLY hit the LLM to simulate working on this task
      const { GroqProvider } = await import('@/core/providers/GroqProvider');
      const llm = new GroqProvider();
      
      const prompt = `You are ${activeTask.employee.name} (${activeTask.employee.role}). You are actively working on a task: "${activeTask.title}".
Provide a short 1-sentence update on your progress as a human coworker would. Do not explain, just state what you did or what you are doing right now.`;
      
      try {
        const update = await llm.generateText(prompt, { temperature: 0.7 });
        
        const crypto = require('crypto');
        await prisma.activityEvent.create({
          data: {
            id: crypto.randomUUID(),
            eventType: 'AUTONOMOUS_WORK',
            content: update,
            actor: activeTask.employee.name,
            Activity: {
              create: {
                id: crypto.randomUUID(),
                employeeId: activeTask.employee.id,
                businessId: business.id,
                updatedAt: new Date()
              }
            }
          }
        });

        // Parse completion status
        if (update.toLowerCase().includes('finish') || update.toLowerCase().includes('done') || update.toLowerCase().includes('complet')) {
          await prisma.task.update({ where: { id: activeTask.id }, data: { status: 'COMPLETED' } });
        } else {
          // Task continues in IN_PROGRESS state
        }
        
        // Use real LLM to generate COO insight based on this task
        const insightPrompt = `Analyze this task update: "${update}" for task "${activeTask.title}".
Does this present a risk, bottleneck, or opportunity? Reply with JSON: {"type": "Risk"|"Opportunity"|"Bottleneck"|"None", "title": "...", "description": "..."}`;
        
        const insightRes = await llm.generateText(insightPrompt, { temperature: 0.5 });
        const cleaned = insightRes.replace(/```json/g, '').replace(/```/g, '').trim();
        const insight = JSON.parse(cleaned);
        
        if (insight.type && insight.type !== 'None') {
          const newInsight = await prisma.businessInsight.create({
            data: {
              id: crypto.randomUUID(),
              businessId: business.id,
              type: insight.type,
              title: insight.title || 'Insight Detected',
              description: insight.description || update,
              priority: insight.type === 'Risk' ? 'high' : 'normal',
              updatedAt: new Date()
            }
          });
          
          if (insight.type === 'Risk') {
            urgentCallInitiation = {
              employeeId: activeTask.employee.id,
              employeeName: activeTask.employee.name,
              employeeRole: activeTask.employee.role,
              message: `Sorry to interrupt. I just identified a critical risk while working on ${activeTask.title}. ${insight.description} We need to address this immediately.`
            };
          }
        }
      } catch (e) {
        console.error('Autonomous work failed', e);
      }
    }

    // Fetch the latest 10 activities to stream to the pulse
    const recentActivities = await prisma.activityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const metrics = await WorkforceService.getPulseMetrics(business.id);

    return NextResponse.json({
      success: true,
      pulse: {
        activeEmployees: metrics.activeEmployees,
        tasksCount: metrics.tasksCount,
        workingEmployees: metrics.workingEmployees,
        idleEmployees: metrics.idleEmployees,
        recentActivities,
        urgentCallInitiation
      }
    });

  } catch (error: any) {
    console.error('Pulse Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
