import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventService } from '@/lib/services/EventService';

export async function POST(req: Request) {
  try {
    const event = await req.json();
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    switch (event.type) {
      case 'DECISION_MADE':
        await prisma.memory.create({
          data: {
            id: `mem_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
            businessId: business.id,
            employeeId: event.payload.employeeId || null,
            type: 'DECISION',
            key: event.payload.key || 'decision',
            value: event.payload.value,
            status: 'ACTIVE',
            updatedAt: new Date()
          }
        });
        
        // Ripple: Create BusinessInsight if priority is high
        if (event.priority === 'high' || event.priority === 'critical') {
          await prisma.businessInsight.create({
            data: {
              businessId: business.id,
              type: 'STRATEGIC_DECISION',
              title: `Strategic Decision: ${event.payload.key}`,
              description: event.payload.value,
              priority: event.priority.toUpperCase(),
              status: 'PENDING',
              updatedAt: new Date()
            }
          });
        }
        break;

      case 'TASK_ASSIGNED':
        if (event.payload.employeeId) {
          await prisma.task.create({
            data: {
              id: `task_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
              employeeId: event.payload.employeeId,
              businessId: business.id,
              title: event.payload.title,
              description: event.payload.description || null,
              status: 'PENDING',
              priority: event.payload.priority || 'MEDIUM'
            }
          });
        }
        break;

      case 'ACTIVITY_LOGGED':
        let activity = await prisma.activity.findFirst({
          where: { businessId: business.id },
          orderBy: { createdAt: 'desc' }
        });
        
        if (!activity) {
          activity = await prisma.activity.create({
            data: {
              id: `act_sys_${Date.now()}`,
              businessId: business.id,
              employeeId: event.payload.employeeId || 'general',
              source: 'system',
              updatedAt: new Date()
            }
          });
        }

        await prisma.activityEvent.create({
          data: {
            id: `evt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
            activityId: activity.id,
            eventType: event.payload.eventType || event.type,
            actor: event.sender || 'System',
            content: event.payload.content || JSON.stringify(event.payload),
            metadata: event.payload.metadata || {}
          }
        });
        break;

      case 'KNOWLEDGE_CREATED':
        await prisma.businessKnowledge.create({
          data: {
            businessId: business.id,
            title: event.payload.title,
            content: event.payload.content,
            keywords: event.payload.tags || [],
            sourceType: event.payload.sourceType || 'SYSTEM'
          }
        });
        break;

      case 'MEMORY_SYNCED':
        if (event.payload.key && event.payload.value) {
           await prisma.memory.create({
             data: {
               id: `mem_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
               businessId: business.id,
               employeeId: event.payload.employeeId || null,
               type: 'GENERAL',
               key: event.payload.key,
               value: event.payload.value,
               status: 'ACTIVE',
               updatedAt: new Date()
             }
           });
        }
        break;

      case 'AGENT_HIRED':
        // Ripple: Create EmployeeAnalytics and GamificationProfile
        if (event.payload.employeeId) {
          await prisma.employeeAnalytics.create({
            data: {
              employeeId: event.payload.employeeId,
              updatedAt: new Date(),
              successMetrics: ['mission_completion', 'accuracy']
            }
          });
          
          await prisma.gamificationProfile.create({
             data: {
               employeeId: event.payload.employeeId,
               updatedAt: new Date(),
               achievements: ['ONBOARDED']
             }
          });
          
          // Timeline Event
          await EventService.publish({
            businessId: business.id,
            eventType: 'EMPLOYEE_HIRED',
            module: 'WORKFORCE',
            title: 'New Agent Hired',
            description: `Agent ${event.payload.employeeId} was onboarded into the workforce.`,
            actor: 'System',
            targetEntity: 'Employee',
            relatedEmployeeId: event.payload.employeeId,
            severity: 'SUCCESS'
          });
        }
        break;

      case 'MEETING_COMPLETED':
        // Ripple: Timeline event
        await EventService.publish({
          businessId: business.id,
          eventType: 'BOARDROOM_MEETING_COMPLETED',
          module: 'BOARDROOM',
          title: 'Boardroom Meeting Concluded',
          description: event.payload.content || 'A strategic meeting was concluded and decisions were logged.',
          actor: 'System',
          targetEntity: 'Meeting',
          severity: 'INFO'
        });
        break;
        
      default:
        console.log('[System Persist] Ignored event type:', event.type);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Persistence API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
