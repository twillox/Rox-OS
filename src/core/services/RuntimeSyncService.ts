type SyncCallback = (data: any) => void;

export class RuntimeSyncService {
  private static instance: RuntimeSyncService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<SyncCallback>> = new Map();
  private isPolling = false;

  private constructor() {}

  public static getInstance(): RuntimeSyncService {
    if (!RuntimeSyncService.instance) {
      RuntimeSyncService.instance = new RuntimeSyncService();
    }
    return RuntimeSyncService.instance;
  }

  public subscribe(channel: string, callback: SyncCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    if (!this.isPolling) {
      this.startPolling();
    }

    return () => {
      this.listeners.get(channel)?.delete(callback);
      if (this.listeners.get(channel)?.size === 0) {
        this.listeners.delete(channel);
      }
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  private startPolling() {
    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchSyncData();
      } catch (e) {
        console.error('RuntimeSync sync failed', e);
      }
    }, 5000); // Poll every 5s for MVP
    
    // Initial fetch
    this.fetchSyncData();
  }

  private stopPolling() {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async fetchSyncData() {
    // Determine what channels are active to optimize fetching
    const activeChannels = Array.from(this.listeners.keys());

    // Let's create an aggregated sync API: /api/os/system/sync
    const response = await fetch('/api/os/system/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels: activeChannels })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Notify listeners for each channel
      activeChannels.forEach(channel => {
        if (data[channel] !== undefined) {
          this.listeners.get(channel)?.forEach(cb => cb(data[channel]));
        }
      });
    }
  }
}
