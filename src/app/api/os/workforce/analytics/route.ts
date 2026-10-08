import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const analytics = await prisma.employeeAnalytics.findMany({
      where: { employee: { businessId: business.id } },
      include: { employee: true }
    });
    
    const totalConversations = analytics.reduce((acc: number, curr: any) => acc + curr.totalConversations, 0);
    const successfulGoals = analytics.reduce((acc: number, curr: any) => acc + curr.successfulGoals, 0);
    const globalSuccessRate = totalConversations > 0 ? ((successfulGoals / totalConversations) * 100).toFixed(1) : 100;

    return NextResponse.json({
      analytics,
      summary: {
        totalConversations,
        successfulGoals,
        globalSuccessRate,
        totalAgents: analytics.length
      }
    });
  } catch (error: any) {
    console.error('Analytics Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
