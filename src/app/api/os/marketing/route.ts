import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventService } from '@/lib/services/EventService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    let campaigns = await prisma.marketingCampaign.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!campaigns || campaigns.length === 0) {
      const defaultCampaigns = [
        {
          id: `camp_1_${business.id}`,
          businessId: business.id,
          name: 'Zero-Overhead Autonomous Enterprise',
          status: 'ACTIVE',
          objectives: 'Drive 500 qualified inbound B2B signups via founder automation thought leadership',
          audience: 'Mid-Market Founders, CTOs, and Operations Leaders',
          budget: '45000',
          createdAt: new Date().toISOString()
        },
        {
          id: `camp_2_${business.id}`,
          businessId: business.id,
          name: 'Voice C-Suite Viral Demos',
          status: 'ACTIVE',
          objectives: 'Showcase real-time voice meetings and boardroom debate on LinkedIn & X',
          audience: 'Tech Innovators & Early Stage Builders',
          budget: '25000',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];

      for (const dc of defaultCampaigns) {
        await prisma.marketingCampaign.create({ data: dc }).catch(() => {});
      }

      campaigns = await prisma.marketingCampaign.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, objective, channels, targetAudience, budget } = await req.json();
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const campaign = await prisma.marketingCampaign.create({
      data: {
        businessId: business.id,
        name,
        status: 'ACTIVE', // Switch to ACTIVE immediately for "alive" feel
        objectives: objective,
        audience: targetAudience,
        budget: budget ? budget.toString() : '0'
      }
    });

    // Auto-assign task to a marketing employee if one exists
    const marketingDept = await prisma.department.findFirst({ where: { businessId: business.id, name: 'Marketing' }});
    let assigneeId: string | null = null;
    if (marketingDept) {
      const marketer = await prisma.employee.findFirst({ where: { departmentId: marketingDept.id }});
      if (marketer) assigneeId = marketer.id;
    }
    if (!assigneeId) {
      const anyEmployee = await prisma.employee.findFirst({ where: { businessId: business.id } });
      if (anyEmployee) assigneeId = anyEmployee.id;
      else {
        // Fallback: Create a system agent if none exist
        const sysAgent = await prisma.employee.create({
           data: { businessId: business.id, name: 'System Agent', role: 'System', personality: 'Neutral', permissions: [] }
        });
        assigneeId = sysAgent.id;
      }
    }

    const task = await prisma.task.create({
      data: {
        businessId: business.id,
        employeeId: assigneeId,
        title: `Execute Campaign: ${name}`,
        description: `Target Audience: ${targetAudience}\nObjective: ${objective}\nBudget: $${budget}`,
        priority: 'HIGH',
        status: 'PENDING',
        requiresApproval: false,
        updatedAt: new Date()
      }
    });

    await EventService.publish({
      businessId: business.id,
      eventType: 'MARKETING_CAMPAIGN_CREATED',
      module: 'MARKETING',
      title: `Campaign Launched: ${name}`,
      description: `Campaign created and assigned to Marketing. Budget: $${budget}`,
      actor: 'CEO',
      targetEntity: 'Campaign',
      relatedEntityId: campaign.id,
      severity: 'SUCCESS'
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
