import { RuntimeEngine, SystemEvent, EngineResult } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext } from '../models/MissionContext';

export class PersistenceEngine implements RuntimeEngine {
  public name = 'PersistenceEngine';
  private pipeline: EventPipeline;
  
  // Events we actually want to persist via the API
  private persistableEvents = [
    'DECISION_MADE',
    'TASK_ASSIGNED',
    'ACTIVITY_LOGGED',
    'KNOWLEDGE_CREATED',
    'MEMORY_SYNCED',
    'AGENT_HIRED',
    'MEETING_COMPLETED'
  ];

  constructor() {
    this.pipeline = EventPipeline.getInstance();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    return { success: true, message: 'Persistence engine running' };
  }

  public observe(events: SystemEvent[]): void {
    events.forEach(event => {
      if (this.persistableEvents.includes(event.type)) {
        this.persistEvent(event);
      }
    });
  }

  private async persistEvent(event: SystemEvent) {
    try {
      await fetch('/api/os/system/persist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (e) {
      console.error(`[PersistenceEngine] Failed to persist event ${event.type}`, e);
    }
  }
}
