import { RuntimeEngine, SystemEvent, EngineResult } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext } from '../models/MissionContext';
import prisma from '@/lib/prisma';

export class WorkforceManager implements RuntimeEngine {
  public name = 'WorkforceManager';
  private eventPipeline: EventPipeline;

  constructor() {
    this.eventPipeline = EventPipeline.getInstance();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    return { success: true, message: 'WorkforceManager executed' };
  }

  public observe(events: SystemEvent[]): void {
    events.forEach(event => {
      if (event.type === 'DEPARTMENT_ACTIVATED' && event.receiver === 'WorkforceManager') {
        const node = event.payload.node;
        
        this.eventPipeline.dispatch({
          type: 'SYSTEM_LOG',
          sender: this.name,
          receiver: 'all',
          intent: 'ASSIGNING_WORKERS',
          payload: { message: `Assigning AI Specialists to "${node.label}"...` },
          priority: 'normal',
          status: 'processing'
        });

        // Run async matching
        this.assignWorkers(node, event.missionId!, event.sender).catch(e => console.error(e));
      }
    });
  }

  private async assignWorkers(node: any, missionId: string, sender: string) {
    try {
      const business = await prisma.business.findFirst();
      if (!business) throw new Error("No business found");

      // Find employees that fit the capabilities/department
      const potentialWorkers = await prisma.employee.findMany({
        where: {
          businessId: business.id,
          isActive: true
        },
        include: { department: true }
      });

      // Filter logic: prefer matching department, fallback to matching tags/skills
      const assigned = potentialWorkers.filter(w => {
        const matchesDept = w.department?.name === node.department || w.role.includes(node.department);
        const matchesSkills = node.capabilities?.some((cap: string) => 
          w.knowledgeAccessTags.includes(cap) || w.role.includes(cap) || w.responsibilities?.includes(cap)
        );
        return matchesDept || matchesSkills;
      });

      // If no perfect match, assign the first general worker available (CEO/General)
      let workersToAssign = assigned.map(a => a.name);
      if (workersToAssign.length === 0 && potentialWorkers.length > 0) {
         workersToAssign = [potentialWorkers[0].name];
      }

      this.eventPipeline.dispatch({
        type: 'WORKER_ASSIGNED',
        missionId: missionId,
        sender: this.name,
        receiver: sender, // Sending back to the department runtime
        intent: 'WORKERS_READY',
        payload: {
          nodeId: node.id,
          workers: workersToAssign.length > 0 ? workersToAssign : ['General Agent']
        },
        priority: 'normal',
        status: 'completed'
      });
    } catch (e: any) {
      this.eventPipeline.dispatch({
        type: 'SYSTEM_LOG',
        sender: this.name,
        receiver: 'all',
        intent: 'WORKER_ASSIGNMENT_FAILED',
        payload: { message: `Failed to assign workers: ${e.message}` },
        priority: 'critical',
        status: 'failed'
      });
    }
  }
}

