import { SystemEvent } from '../interfaces';

type EventCallback = (event: SystemEvent) => void;

export class EventPipeline {
  private static instance: EventPipeline;
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private history: SystemEvent[] = [];

  private constructor() {}

  public static getInstance(): EventPipeline {
    if (!EventPipeline.instance) {
      EventPipeline.instance = new EventPipeline();
    }
    return EventPipeline.instance;
  }

  public subscribe(eventType: string | '*', callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);

    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  public dispatch(event: Omit<SystemEvent, 'id' | 'timestamp'>): SystemEvent {
    const fullEvent: SystemEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.history.push(fullEvent);
    
    const specificListeners = this.subscribers.get(fullEvent.type);
    if (specificListeners) {
      specificListeners.forEach(cb => {
        try { cb(fullEvent); } catch (e) { console.error(`Error in event listener for ${fullEvent.type}`, e); }
      });
    }

    const allListeners = this.subscribers.get('*');
    if (allListeners) {
      allListeners.forEach(cb => {
        try { cb(fullEvent); } catch (e) { console.error(`Error in wildcard event listener`, e); }
      });
    }

    return fullEvent;
  }

  public getHistory(): SystemEvent[] {
    return [...this.history];
  }
}
