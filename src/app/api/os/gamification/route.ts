import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventService } from '@/lib/services/EventService';

export async function PATCH(req: Request) {
  try {
    const { employeeId, autonomyLevel, points, level } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure gamification profile exists
    let profile = await prisma.gamificationProfile.findFirst({
      where: { employeeId }
    });

    if (!profile) {
      profile = await prisma.gamificationProfile.create({
        data: {
          id: `gam_${Date.now()}`,
          employeeId,
          updatedAt: new Date(),
          points: points || 0,
          level: level || 1,
          achievements: []
        }
      });
    } else {
      profile = await prisma.gamificationProfile.update({
        where: { id: profile.id },
        data: {
          points: points !== undefined ? points : undefined,
          level: level !== undefined ? level : undefined,
        }
      });
    }

    // Update the employee's actual runtimeConfig if autonomyLevel is provided
    if (autonomyLevel) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (employee) {
        const config = employee.runtimeConfig || {};
        await prisma.employee.update({
          where: { id: employeeId },
          data: {
            runtimeConfig: {
              ...config,
              autonomyLevel
            }
          }
        });

        // Log Timeline Event for Promotion/Autonomy Change
        await EventService.publish({
          businessId,
          eventType: 'GAMIFICATION_PROMOTION',
          module: 'GAMIFICATION',
          title: `Employee Promoted: ${employee.name}`,
          description: `${employee.name}'s autonomy level was upgraded to ${autonomyLevel}.`,
          actor: 'System',
          targetEntity: 'Employee',
          relatedEmployeeId: employee.id,
          severity: 'SUCCESS'
        });

        // Log Activity Event for the employee's active desk
        let activity = await prisma.activity.findFirst({
          where: { businessId, employeeId, source: 'system' }
        });
        if (!activity) {
          activity = await prisma.activity.create({
            data: {
              id: `act_sys_${Date.now()}`,
              businessId,
              employeeId,
              source: 'system',
              status: 'active',
              updatedAt: new Date()
            }
          });
        }
        await prisma.activityEvent.create({
          data: {
            id: `evt_sys_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            activityId: activity.id,
            eventType: 'PROMOTION',
            actor: 'System',
            content: `Your autonomy level has been upgraded to ${autonomyLevel}.`
          }
        });
      }
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
