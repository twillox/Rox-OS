type EventCallback = (event: any) => Promise<void> | void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  public subscribe(eventType: string, callback: EventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
    console.log(`[EventBus] Subscribed to ${eventType}`);
  }

  public async publish(eventType: string, payload: any) {
    console.log(`[EventBus] Publishing ${eventType}`, payload);
    const callbacks = this.listeners.get(eventType) || [];
    // We execute them asynchronously so the publisher isn't blocked
    for (const callback of callbacks) {
      try {
        await callback(payload);
      } catch (e) {
        console.error(`[EventBus] Error in listener for ${eventType}:`, e);
      }
    }
  }
}

export const globalEventBus = new EventBus();
