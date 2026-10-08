import { RuntimeEngine, SystemEvent, EngineResult } from '../interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import { MissionContext, ExecutionGraph } from '../models/MissionContext';

export class MissionScheduler implements RuntimeEngine {
  public name = 'MissionScheduler';
  private eventPipeline: EventPipeline;
  private activeGraphs: Map<string, ExecutionGraph> = new Map();

  constructor() {
    this.eventPipeline = EventPipeline.getInstance();
  }

  public async initialize(): Promise<void> {
    return Promise.resolve();
  }

  public async execute(context: MissionContext): Promise<EngineResult> {
    const graph = context.executionGraph;
    if (!graph) return { success: false, message: 'No execution graph found' };

    this.eventPipeline.dispatch({
      type: 'SYSTEM_LOG',
      sender: this.name,
      receiver: 'all',
      intent: 'SCHEDULING_MISSION',
      payload: { message: `Scheduling tasks across ${graph.nodes.length} nodes.` },
      priority: 'normal',
      status: 'processing'
    });

    context.status = 'scheduling';
    this.activeGraphs.set(context.id, graph);

    // Dispatch independent nodes immediately
    graph.nodes.forEach(node => {
      if (node.dependencies.length === 0) {
        this.dispatchNode(node, context.id);
      }
    });

    return { success: true, message: 'Initial nodes dispatched' };
  }

  private dispatchNode(node: any, missionId: string) {
    this.eventPipeline.dispatch({
      type: 'DEPARTMENT_ACTIVATED',
      missionId,
      sender: this.name,
      receiver: 'DecisionEngine', // Passes through Decision Engine for routing
      intent: 'EXECUTE_NODE',
      payload: { node },
      priority: 'high',
      status: 'pending'
    });
  }

  public observe(events: SystemEvent[]): void {
    events.forEach(event => {
      if (event.type === 'MISSION_PLANNED' && event.receiver === 'MissionScheduler') {
        const context: MissionContext = {
          id: event.missionId!,
          objective: 'Recovered context',
          status: 'planning',
          departmentsRequired: [],
          capabilitiesRequired: [],
          executionGraph: event.payload.graph
        };
        this.execute(context);
      }

      // Handle subsequent dispatch when tasks complete
      if (event.type === 'TASK_COMPLETED' && event.receiver === 'MissionScheduler') {
        const completedNodeId = event.payload.nodeId;
        const graph = this.activeGraphs.get(event.missionId!);
        
        if (graph) {
          // Update the completed node
          const cNode = graph.nodes.find(n => n.id === completedNodeId);
          if (cNode) {
            cNode.status = 'completed';
          }
          
          let allCompleted = true;

          // Find nodes that are pending and have all dependencies met
          graph.nodes.forEach((node: any) => {
            if (node.status === 'pending') {
              const depsMet = node.dependencies.every((depId: string) => {
                const depNode = graph.nodes.find((n: any) => n.id === depId);
                return depNode && depNode.status === 'completed';
              });
              if (depsMet) {
                this.dispatchNode(node, event.missionId!);
              } else {
                allCompleted = false;
              }
            } else if (node.status !== 'completed') {
              allCompleted = false;
            }
          });

          // If all completed, dispatch MISSION_COMPLETED
          if (allCompleted) {
            this.eventPipeline.dispatch({
              type: 'MISSION_COMPLETED',
              missionId: event.missionId,
              sender: this.name,
              receiver: 'all',
              intent: 'MISSION_DONE',
              payload: { message: 'All tasks completed successfully' },
              priority: 'critical',
              status: 'completed'
            });
            this.activeGraphs.delete(event.missionId!);
          }
        }
      }
    });
  }
}
