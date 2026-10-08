import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';
import { ensureBusinessInitialized, DEFAULT_BUSINESS_ID } from '@/lib/services/SeedService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    let businessId = cookieStore.get('businessId')?.value || DEFAULT_BUSINESS_ID;
    
    // Ensure enterprise records exist
    const business = await ensureBusinessInitialized(businessId);

    const [firebaseBrain, firebaseReports, firebaseKB] = await Promise.all([
      IntelligenceService.getCompanyBrain(business.id).catch(() => []),
      IntelligenceService.getReports(business.id).catch(() => []),
      IntelligenceService.getKnowledgeBase(business.id).catch(() => [])
    ]);

    // Fallback to Prisma if Firestore didn't return seeded insights
    let dbInsights = await prisma.businessInsight.findMany({ where: { businessId: business.id } });
    let dbKnowledge = await prisma.businessKnowledge.findMany({ where: { businessId: business.id } });

    const combinedBrain = firebaseBrain.length > 0 ? firebaseBrain : dbInsights.map((i: any) => ({
      id: i.id,
      title: i.title || i.content,
      content: i.content,
      actionable: i.actionable,
      impact: i.impact || 'High',
      category: i.category || 'Strategic',
      createdAt: i.createdAt || new Date().toISOString()
    }));

    const combinedKB = firebaseKB.length > 0 ? firebaseKB : dbKnowledge;
    
    // Map brain nodes to expected response structure
    const insights = combinedBrain.map((node: any) => ({
      id: node.id,
      title: node.title || node.content || 'Insight',
      description: node.actionable || node.content || '',
      impact: node.impact || 'High',
      category: node.category || 'General',
      createdAt: node.createdAt
    }));
    
    const [tasks, timelineEvents, dna] = await Promise.all([
      prisma.task.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.businessTimelineEvent.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      IntelligenceService.getCompanyDNA(business.id).catch(() => null)
    ]);

    return NextResponse.json({
      metrics: {
        totalMemories: combinedBrain.length,
        knowledgeNodes: combinedKB.length,
        recentActivities: timelineEvents.length,
        activeTasks: tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
        insights: insights.length,
        timelineEvents: timelineEvents.length
      },
      business,
      dna,
      memories: combinedBrain,
      knowledge: combinedKB,
      meetings: firebaseReports.filter((r: any) => r.type === 'meeting' || r.title?.includes('Meeting')),
      tasks,
      insights,
      timelineEvents
    });
  } catch (error: any) {
    console.error('Error fetching brain data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
