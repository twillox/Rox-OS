export interface ExecutionNode {
  id: string;
  label: string;
  department: string;
  capabilities: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  assignedWorkers: string[];
  dependencies: string[];
  progress: number;
  confidence: number;
  eta: number;
}

export interface ExecutionEdge {
  source: string;
  target: string;
  active: boolean;
}

export interface ExecutionGraph {
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
}

export class MissionContext {
  id: string;
  objective: string;
  status: 'created' | 'analyzing' | 'planning' | 'scheduling' | 'executing' | 'reviewing' | 'completed' | 'archived';
  departmentsRequired: string[];
  capabilitiesRequired: string[];
  executionGraph?: ExecutionGraph;

  constructor(id: string, objective: string) {
    this.id = id;
    this.objective = objective;
    this.status = 'created';
    this.departmentsRequired = [];
    this.capabilitiesRequired = [];
  }
}
