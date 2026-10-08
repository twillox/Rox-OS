import { RuntimeEngine, EngineResult } from '../interfaces';
import { MissionContext } from '../models/MissionContext';
import { EventPipeline } from '../messaging/EventPipeline';

export class DepartmentRuntime implements RuntimeEngine {
  public name: string;
  private eventPipeline: EventPipeline;

  constructor(departmentName: string) {
    this.name = `${departmentName}Runtime`;
    this.eventPipeline = EventPipeline.getInstance();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    return { success: true, message: `${this.name} executed` };
  }

  public observe(events: any[]): void {
    events.forEach(event => {
      if (event.type === 'DEPARTMENT_ACTIVATED' && event.receiver === this.name) {
        const node = event.payload.node;
        
        this.eventPipeline.dispatch({
          type: 'DEPARTMENT_ACTIVATED',
          missionId: event.missionId,
          sender: this.name,
          receiver: 'WorkforceManager',
          intent: 'REQUEST_WORKERS',
          payload: { node },
          priority: 'high',
          status: 'pending'
        });
      }

      if (event.type === 'WORKER_ASSIGNED' && event.receiver === this.name) {
        const nodeId = event.payload.nodeId;
        
        this.eventPipeline.dispatch({
          type: 'SYSTEM_LOG',
          sender: this.name,
          receiver: 'all',
          intent: 'EXECUTING_TASK',
          payload: { message: `${this.name} executing task with assigned AI workers.` },
          priority: 'normal',
          status: 'processing'
        });

        // Actual Execution via LLM
        this.executeTask(event, nodeId).catch(console.error);
      }
    });
  }

  private async executeTask(event: any, nodeId: string) {
    try {
      const GroqProvider = (await import('@/core/providers/GroqProvider')).GroqProvider;
      const prisma = (await import('@/lib/prisma')).default;

      let taskLabel = `task ${nodeId}`;
      let missionDesc = 'the current mission';

      if (event.payload?.nodeLabel) {
        taskLabel = event.payload.nodeLabel;
      }
      
      const llm = new GroqProvider();
      const prompt = `You are the ${this.name} department AI. 
      You have been assigned to execute the following task: "${taskLabel}" for ${missionDesc}.
      Generate a concise but highly realistic professional output (1-3 sentences) representing the completion of this task. Do not include introductory text, just the actual work product or executive summary of the action taken.`;
      
      const workProduct = await llm.generateText(prompt, { temperature: 0.7 });

      const business = await prisma.business.findFirst();
      if (business) {
        const activity = await prisma.activity.findFirst({
          where: { businessId: business.id },
          orderBy: { createdAt: 'desc' }
        });

        if (activity) {
          const crypto = require('crypto');
          await prisma.activityEvent.create({
            data: {
              id: `evt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
              activityId: activity.id,
              eventType: 'TASK_EXECUTION',
              actor: `${this.name} Dept`,
              content: `Completed task: ${taskLabel}`,
              metadata: JSON.stringify({ output: workProduct, missionId: event.missionId })
            }
          });
        }
      }

      this.eventPipeline.dispatch({
        type: 'TASK_COMPLETED',
        missionId: event.missionId,
        sender: this.name,
        receiver: 'MissionScheduler',
        intent: 'TASK_DONE',
        payload: { nodeId, completedAt: new Date().toISOString(), result: workProduct },
        priority: 'high',
        status: 'completed'
      });
    } catch (e) {
      console.error(e);
    }
  }
}
