import { RuntimeEngine } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext } from '../models/MissionContext';

export class JarvisCore {
  private static instance: JarvisCore;
  private engines: Map<string, RuntimeEngine> = new Map();
  private eventPipeline: EventPipeline;
  private isBooted: boolean = false;

  private constructor() {
    this.eventPipeline = EventPipeline.getInstance();
  }

  public static getInstance(): JarvisCore {
    if (!JarvisCore.instance) {
      JarvisCore.instance = new JarvisCore();
    }
    return JarvisCore.instance;
  }

  public registerEngine(engine: RuntimeEngine) {
    this.engines.set(engine.name, engine);
    this.eventPipeline.subscribe('*', (event) => {
      engine.observe([event]);
    });
  }

  public getEngine<T extends RuntimeEngine>(name: string): T | undefined {
    return this.engines.get(name) as T;
  }

  public async boot(): Promise<void> {
    if (this.isBooted) return;
    
    this.eventPipeline.dispatch({
      type: 'SYSTEM_LOG',
      sender: 'JarvisCore',
      receiver: 'all',
      intent: 'BOOT_SEQUENCE_START',
      payload: { message: 'Initializing OS Kernel...' },
      priority: 'high',
      status: 'processing'
    });

    for (const engine of this.engines.values()) {
      await engine.initialize();
      this.eventPipeline.dispatch({
        type: 'SYSTEM_LOG',
        sender: 'JarvisCore',
        receiver: 'all',
        intent: 'ENGINE_INITIALIZED',
        payload: { engine: engine.name },
        priority: 'normal',
        status: 'completed'
      });
    }

    this.isBooted = true;
    this.eventPipeline.dispatch({
      type: 'SYSTEM_LOG',
      sender: 'JarvisCore',
      receiver: 'all',
      intent: 'BOOT_SEQUENCE_COMPLETE',
      payload: { message: 'Roxten OS Ready.' },
      priority: 'high',
      status: 'completed'
    });
  }

  public async dispatchCommand(objective: string): Promise<string> {
    const missionId = crypto.randomUUID();
    
    this.eventPipeline.dispatch({
      type: 'INTENT_DETECTED',
      missionId,
      sender: 'CEO',
      receiver: 'IntentEngine',
      intent: 'NEW_MISSION',
      payload: { objective },
      priority: 'high',
      status: 'completed'
    });

    return missionId;
  }
}
