import { RuntimeEngine, SystemEvent, EngineResult } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext, ExecutionGraph } from '../models/MissionContext';
import { GraphGenerator } from './GraphGenerator';
import prisma from '@/lib/prisma';

export class MissionPlanner implements RuntimeEngine {
  public name = 'MissionPlanner';
  private eventPipeline: EventPipeline;

  constructor() {
    this.eventPipeline = EventPipeline.getInstance();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    this.eventPipeline.dispatch({
      type: 'SYSTEM_LOG',
      sender: this.name,
      receiver: 'all',
      intent: 'PLANNING_MISSION',
      payload: { message: `Building autonomous execution graph...` },
      priority: 'high',
      status: 'processing'
    });

    const generator = new GraphGenerator();
    const graph = await generator.generateGraph(context.objective || 'Default Objective');

    context.executionGraph = graph;
    context.status = 'planning';

    try {
      const business = await prisma.business.findFirst();
      if (business) {
        // Fetch all active employees
        const employees = await prisma.employee.findMany({
          where: { businessId: business.id, isActive: true },
          select: { id: true, name: true, role: true, department: true }
        });

        // Create tasks based on graph steps
        for (const node of graph.nodes) {
          // Attempt to map required capabilities to a specific employee role/dept
          const matchedEmployee = employees.find(e => 
            node.capabilities.some(cap => e.role.toLowerCase().includes(cap.toLowerCase())) ||
            (e.department && e.department.name.toLowerCase() === node.department.toLowerCase())
          ) || employees[0]; // Fallback to first available

          if (matchedEmployee) {
            await prisma.task.create({
              data: {
                businessId: business.id,
                employeeId: matchedEmployee.id,
                title: node.label,
                description: `Part of mission: ${context.objective}\nAssigned by autonomous planner.`,
                status: 'PENDING',
                priority: 'HIGH'
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to persist tasks from MissionPlanner', e);
    }

    this.eventPipeline.dispatch({
      type: 'MISSION_PLANNED',
      missionId: context.id,
      sender: this.name,
      receiver: 'MissionScheduler',
      intent: 'GRAPH_CREATED',
      payload: { graph },
      priority: 'critical',
      status: 'completed'
    });

    return { success: true, message: 'Execution graph generated and tasks persisted', data: graph };
  }

  public observe(events: SystemEvent[]): void {
    events.forEach(event => {
      if (event.type === 'INTENT_DETECTED' && event.receiver === 'MissionPlanner') {
        const context: MissionContext = {
          id: event.missionId || `MISSION_${Date.now()}`,
          objective: event.payload.objective || 'Unknown Mission',
          status: 'analyzing',
          departmentsRequired: event.payload.departments,
          capabilitiesRequired: event.payload.capabilities
        };
        this.execute(context);
      }
    });
  }
}
