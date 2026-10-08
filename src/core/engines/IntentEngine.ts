import { RuntimeEngine, SystemEvent, EngineResult } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext } from '../models/MissionContext';
import { GroqProvider } from '../providers/GroqProvider';

export class IntentEngine implements RuntimeEngine {
  public name = 'IntentEngine';
  private eventPipeline: EventPipeline;
  private llm: GroqProvider;

  constructor() {
    this.eventPipeline = EventPipeline.getInstance();
    this.llm = new GroqProvider();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    this.eventPipeline.dispatch({
      type: 'SYSTEM_LOG',
      sender: this.name,
      receiver: 'all',
      intent: 'ANALYZING_INTENT',
      payload: { message: `Analyzing strategic intent for: "${context.objective}"` },
      priority: 'normal',
      status: 'processing'
    });

    try {
      context.status = 'analyzing';

      const prompt = `
You are the Strategic Intent Engine of an autonomous enterprise AI platform.
Analyze the following mission objective: "${context.objective}"

Identify the high-level departments required to fulfill this objective (e.g., Marketing, Engineering, Finance, Operations, Sales, Legal, Creative, HR).
Also identify the specific core capabilities required (e.g., Budgeting, Campaign Planning, Software Development).

Return strictly valid JSON matching this schema:
{
  "departments": ["string"],
  "capabilities": ["string"]
}
      `;

      const response = await this.llm.generateJSON<{ departments: string[], capabilities: string[] }>(prompt);
      
      context.departmentsRequired = response.departments || ['General'];
      context.capabilitiesRequired = response.capabilities || ['Execution'];
      
      this.eventPipeline.dispatch({
        type: 'SYSTEM_LOG',
        sender: this.name,
        receiver: 'all',
        intent: 'INTENT_EXTRACTED',
        payload: { 
          message: `Intent extraction complete. Departments identified: ${context.departmentsRequired.join(', ')}. Capabilities: ${context.capabilitiesRequired.join(', ')}.` 
        },
        priority: 'high',
        status: 'completed'
      });

      this.eventPipeline.dispatch({
        type: 'INTENT_DETECTED',
        missionId: context.id,
        sender: this.name,
        receiver: 'MissionPlanner',
        intent: 'INTENT_PARSED',
        payload: {
          objective: context.objective, // Ensure the objective flows cleanly
          departments: context.departmentsRequired,
          capabilities: context.capabilitiesRequired,
        },
        priority: 'high',
        status: 'completed'
      });

      return { success: true, message: 'Intent parsed successfully', data: context };
    } catch (e: any) {
      this.eventPipeline.dispatch({
        type: 'SYSTEM_LOG',
        sender: this.name,
        receiver: 'all',
        intent: 'INTENT_FAILED',
        payload: { message: `Failed to extract intent: ${e.message}` },
        priority: 'critical',
        status: 'failed'
      });
      return { success: false, message: 'Failed to parse intent' };
    }
  }

  public observe(events: SystemEvent[]): void {
    events.forEach(event => {
      if (event.type === 'INTENT_DETECTED' && event.receiver === this.name && event.intent === 'NEW_MISSION') {
        const objective = event.payload?.objective || 'Unknown Mission';
        const context = new MissionContext(event.missionId!, objective);
        this.execute(context).catch(e => console.error('IntentEngine execution failed', e));
      }
    });
  }
}

