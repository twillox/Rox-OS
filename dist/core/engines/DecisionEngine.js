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
exports.DecisionEngine = void 0;
const EventPipeline_1 = require("../messaging/EventPipeline");
class DecisionEngine {
    constructor() {
        this.name = 'DecisionEngine';
        this.eventPipeline = EventPipeline_1.EventPipeline.getInstance();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: true, message: 'Decision Engine executed' };
        });
    }
    observe(events) {
        events.forEach(event => {
            if (event.type === 'DEPARTMENT_ACTIVATED' && event.receiver === 'DecisionEngine') {
                const node = event.payload.node;
                this.eventPipeline.dispatch({
                    type: 'SYSTEM_LOG',
                    sender: this.name,
                    receiver: 'all',
                    intent: 'ROUTING_TASK',
                    payload: { message: `Routing task "${node.label}" to ${node.department} Runtime.` },
                    priority: 'normal',
                    status: 'completed'
                });
                // Forward to the specific DepartmentRuntime
                this.eventPipeline.dispatch(Object.assign(Object.assign({}, event), { sender: this.name, receiver: `${node.department}Runtime`, status: 'processing' }));
            }
        });
    }
}
exports.DecisionEngine = DecisionEngine;
