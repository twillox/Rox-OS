"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionScheduler = void 0;
const EventPipeline_1 = require("../messaging/EventPipeline");
class MissionScheduler {
    constructor() {
        this.name = 'MissionScheduler';
        this.activeGraphs = new Map();
        this.eventPipeline = EventPipeline_1.EventPipeline.getInstance();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = context.executionGraph;
            if (!graph)
                return { success: false, message: 'No execution graph found' };
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
        });
    }
    dispatchNode(node, missionId) {
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
    observe(events) {
        events.forEach(event => {
            if (event.type === 'MISSION_PLANNED' && event.receiver === 'MissionScheduler') {
                const context = {
                    id: event.missionId,
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
                const graph = this.activeGraphs.get(event.missionId);
                if (graph) {
                    // Update the completed node
                    const cNode = graph.nodes.find(n => n.id === completedNodeId);
                    if (cNode) {
                        cNode.status = 'completed';
                    }
                    let allCompleted = true;
                    // Find nodes that are pending and have all dependencies met
                    graph.nodes.forEach((node) => {
                        if (node.status === 'pending') {
                            const depsMet = node.dependencies.every((depId) => {
                                const depNode = graph.nodes.find((n) => n.id === depId);
                                return depNode && depNode.status === 'completed';
                            });
                            if (depsMet) {
                                this.dispatchNode(node, event.missionId);
                            }
                            else {
                                allCompleted = false;
                            }
                        }
                        else if (node.status !== 'completed') {
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
                        this.activeGraphs.delete(event.missionId);
                    }
                }
            }
        });
    }
}
exports.MissionScheduler = MissionScheduler;
