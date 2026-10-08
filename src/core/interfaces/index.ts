export interface SystemEvent {
  id: string;
  type: string;
  timestamp: number;
  missionId?: string;
  sender: string;
  receiver: string | 'all';
  intent: string;
  payload: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface EngineResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface RuntimeEngine {
  name: string;
  initialize(): Promise<void>;
  execute(context: any): Promise<EngineResult>;
  observe(events: SystemEvent[]): void;
}
