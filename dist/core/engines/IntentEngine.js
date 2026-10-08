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
exports.IntentEngine = void 0;
const EventPipeline_1 = require("../messaging/EventPipeline");
const MissionContext_1 = require("../models/MissionContext");
class IntentEngine {
    constructor() {
        this.name = 'IntentEngine';
        this.eventPipeline = EventPipeline_1.EventPipeline.getInstance();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Simulated boot delay
            return Promise.resolve();
        });
    }
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            this.eventPipeline.dispatch({
                type: 'SYSTEM_LOG',
                sender: this.name,
                receiver: 'all',
                intent: 'ANALYZING_INTENT',
                payload: { message: `Analyzing intent for: "${context.objective}"` },
                priority: 'normal',
                status: 'processing'
            });
            // Hardcoded logic for the demo "Launch SpiceNest" scenario
            yield new Promise(resolve => setTimeout(resolve, 1500)); // simulate thinking
            context.status = 'analyzing';
            // Simulate intent extraction
            context.departmentsRequired = ['Marketing', 'Finance', 'Creative', 'Sales', 'Legal', 'Operations'];
            context.capabilitiesRequired = ['Campaign Planning', 'Budgeting', 'Asset Generation', 'CRM Pipeline', 'Compliance'];
            // In a real flow, it would update the context and then MissionPlanner picks it up.
            this.eventPipeline.dispatch({
                type: 'INTENT_DETECTED',
                missionId: context.id,
                sender: this.name,
                receiver: 'MissionPlanner',
                intent: 'INTENT_PARSED',
                payload: {
                    departments: context.departmentsRequired,
                    capabilities: context.capabilitiesRequired,
                },
                priority: 'high',
                status: 'completed'
            });
            return { success: true, message: 'Intent parsed successfully', data: context };
        });
    }
    observe(events) {
        events.forEach(event => {
            var _a;
            if (event.type === 'INTENT_DETECTED' && event.receiver === this.name && event.intent === 'NEW_MISSION') {
                const objective = ((_a = event.payload) === null || _a === void 0 ? void 0 : _a.objective) || 'Unknown Mission';
                const context = new MissionContext_1.MissionContext(event.missionId, objective);
                this.execute(context).catch(e => console.error('IntentEngine execution failed', e));
            }
        });
    }
}
exports.IntentEngine = IntentEngine;
