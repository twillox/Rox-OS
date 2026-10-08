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
exports.DepartmentRuntime = void 0;
const EventPipeline_1 = require("../messaging/EventPipeline");
class DepartmentRuntime {
    constructor(departmentName) {
        this.name = `${departmentName}Runtime`;
        this.eventPipeline = EventPipeline_1.EventPipeline.getInstance();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    execute(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: true, message: `${this.name} executed` };
        });
    }
    observe(events) {
        events.forEach(event => {
            if (event.type === 'DEPARTMENT_ACTIVATED' && event.receiver === this.name) {
                const node = event.payload.node;
                this.eventPipeline.dispatch({
                    type: 'DEPARTMENT_ACTIVATED',
                    missionId: event.missionId,
                    sender: this.name,
                    receiver: 'WorkforceManager',
                    intent: 'REQUEST_WORKERS',
                    payload: { node },
                    priority: 'high',
                    status: 'pending'
                });
            }
            if (event.type === 'WORKER_ASSIGNED' && event.receiver === this.name) {
                const nodeId = event.payload.nodeId;
                this.eventPipeline.dispatch({
                    type: 'SYSTEM_LOG',
                    sender: this.name,
                    receiver: 'all',
                    intent: 'EXECUTING_TASK',
                    payload: { message: `${this.name} executing task with assigned AI workers.` },
                    priority: 'normal',
                    status: 'processing'
                });
                setTimeout(() => {
                    this.eventPipeline.dispatch({
                        type: 'TASK_COMPLETED',
                        missionId: event.missionId,
                        sender: this.name,
                        receiver: 'MissionScheduler',
                        intent: 'TASK_DONE',
                        payload: { nodeId },
                        priority: 'high',
                        status: 'completed'
                    });
                }, 3000);
            }
        });
    }
}
exports.DepartmentRuntime = DepartmentRuntime;
