import { RuntimeEngine, SystemEvent, EngineResult } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext, ExecutionGraph } from '../models/MissionContext';

export class CompanyStateEngine implements RuntimeEngine {
  public name = 'CompanyStateEngine';
  private eventPipeline: EventPipeline;

  // Track live state
  public state = {
    health: 100,
    activeMissions: 0,
    completedTasks: 0,
    departmentLoad: {} as Record<string, number>
  };

  constructor() {
    this.eventPipeline = EventPipeline.getInstance();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    return { success: true, message: 'State updated' };
  }

  public observe(events: SystemEvent[]): void {
    events.forEach(event => {
      if (event.type === 'INTENT_DETECTED' || event.type === 'TASK_ASSIGNED') {
        this.state.activeMissions++;
      }
      if (event.type === 'TASK_COMPLETED') {
        this.state.completedTasks++;
        this.state.activeMissions = Math.max(0, this.state.activeMissions - 1);
      }
      if (event.type === 'DEPARTMENT_ACTIVATED') {
        const dept = event.payload.node?.department;
        if (dept) {
          this.state.departmentLoad[dept] = (this.state.departmentLoad[dept] || 0) + 1;
          this.state.health -= 2; // Simulate load affecting health slightly
        }
      }
      if (event.type === 'MISSION_COMPLETED') {
        this.state.activeMissions--;
        this.state.health = 100;
      }
    });
  }
}
