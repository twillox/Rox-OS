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
exports.MissionPlanner = void 0;
const EventPipeline_1 = require("../messaging/EventPipeline");
class MissionPlanner {
    constructor() {
        this.name = 'MissionPlanner';
        this.eventPipeline = EventPipeline_1.EventPipeline.getInstance();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            this.eventPipeline.dispatch({
                type: 'SYSTEM_LOG',
                sender: this.name,
                receiver: 'all',
                intent: 'PLANNING_MISSION',
                payload: { message: `Building autonomous execution graph...` },
                priority: 'high',
                status: 'processing'
            });
            yield new Promise(resolve => setTimeout(resolve, 2000)); // Simulate complex planning
            // Construct the parallel execution graph for SpiceNest demo
            const graph = {
                nodes: [
                    {
                        id: 'marketing_plan',
                        label: 'Campaign Plan & SEO',
                        department: 'Marketing',
                        capabilities: ['Campaign Planning', 'SEO'],
                        status: 'pending',
                        assignedWorkers: [],
                        dependencies: [],
                        progress: 0,
                        confidence: 0,
                        eta: 120
                    },
                    {
                        id: 'budget_alloc',
                        label: 'Budget Allocation',
                        department: 'Finance',
                        capabilities: ['Budgeting'],
                        status: 'pending',
                        assignedWorkers: [],
                        dependencies: [],
                        progress: 0,
                        confidence: 0,
                        eta: 60
                    },
                    {
                        id: 'creative_assets',
                        label: 'Brand Assets & Video',
                        department: 'Creative',
                        capabilities: ['Asset Generation'],
                        status: 'pending',
                        assignedWorkers: [],
                        dependencies: ['marketing_plan'],
                        progress: 0,
                        confidence: 0,
                        eta: 300
                    },
                    {
                        id: 'sales_outreach',
                        label: 'CRM & Outreach',
                        department: 'Sales',
                        capabilities: ['CRM Pipeline'],
                        status: 'pending',
                        assignedWorkers: [],
                        dependencies: ['marketing_plan', 'budget_alloc'],
                        progress: 0,
                        confidence: 0,
                        eta: 240
                    }
                ],
                edges: [
                    { source: 'marketing_plan', target: 'creative_assets', active: false },
                    { source: 'marketing_plan', target: 'sales_outreach', active: false },
                    { source: 'budget_alloc', target: 'sales_outreach', active: false }
                ]
            };
            context.executionGraph = graph;
            context.status = 'planning';
            this.eventPipeline.dispatch({
                type: 'MISSION_PLANNED',
                missionId: context.id,
                sender: this.name,
                receiver: 'MissionScheduler',
                intent: 'GRAPH_CREATED',
                payload: { graph },
                priority: 'critical',
                status: 'completed'
            });
            return { success: true, message: 'Execution graph generated', data: graph };
        });
    }
    observe(events) {
        events.forEach(event => {
            if (event.type === 'INTENT_DETECTED' && event.receiver === 'MissionPlanner') {
                // Kick off planning
                const context = {
                    id: event.missionId,
                    objective: 'Recovered from intent',
                    status: 'analyzing',
                    departmentsRequired: event.payload.departments,
                    capabilitiesRequired: event.payload.capabilities
                };
                this.execute(context);
            }
        });
    }
}
exports.MissionPlanner = MissionPlanner;
