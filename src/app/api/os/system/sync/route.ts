import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { channels } = await req.json();
    if (!channels || !Array.isArray(channels)) {
      return NextResponse.json({ error: 'Missing channels' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const responseData: any = {};

    // 1. Galaxy Channel
    if (channels.includes('galaxy')) {
      const departments = await prisma.department.findMany({
        where: { businessId: business.id },
        include: { employees: true }
      });
      const allEmployees = await prisma.employee.findMany({
        where: { businessId: business.id, departmentId: null }
      });
      responseData.galaxy = {
        name: business.name,
        departments,
        employees: allEmployees
      };
    }

    // 2. Pulse Channel
    if (channels.includes('pulse')) {
      // Could grab latest activity events
      const latestEvents = await prisma.activityEvent.findMany({
        where: { Activity: { businessId: business.id } },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      responseData.pulse = {
        events: latestEvents,
        companyState: { health: 98, activeMissions: 0, completedTasks: 0 } // Ideally from a server-side state engine
      };
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('RuntimeSync API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
