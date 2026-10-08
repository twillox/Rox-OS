import { RuntimeEngine, SystemEvent, EngineResult } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext, ExecutionGraph } from '../models/MissionContext';

export class DecisionEngine implements RuntimeEngine {
  public name = 'DecisionEngine';
  private eventPipeline: EventPipeline;

  constructor() {
    this.eventPipeline = EventPipeline.getInstance();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    return { success: true, message: 'Decision Engine executed' };
  }

  public observe(events: SystemEvent[]): void {
    events.forEach(event => {
      if (event.type === 'DEPARTMENT_ACTIVATED' && event.receiver === 'DecisionEngine') {
        const node = event.payload.node;
        
        this.eventPipeline.dispatch({
          type: 'SYSTEM_LOG',
          sender: this.name,
          receiver: 'all',
          intent: 'ROUTING_TASK',
          payload: { message: `Routing task "${node.label}" to ${node.department} Runtime.` },
          priority: 'normal',
          status: 'completed'
        });

        // Forward to the specific DepartmentRuntime
        this.eventPipeline.dispatch({
          ...event,
          sender: this.name,
          receiver: `${node.department}Runtime`, // e.g., MarketingRuntime
          status: 'processing'
        });
      }
    });
  }
}
