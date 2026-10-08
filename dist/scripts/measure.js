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
const JarvisCore_1 = require("../core/kernel/JarvisCore");
const IntentEngine_1 = require("../core/engines/IntentEngine");
const MissionPlanner_1 = require("../core/engines/MissionPlanner");
const MissionScheduler_1 = require("../core/engines/MissionScheduler");
const DecisionEngine_1 = require("../core/engines/DecisionEngine");
const WorkforceManager_1 = require("../core/engines/WorkforceManager");
const DepartmentRuntime_1 = require("../core/runtime/DepartmentRuntime");
const ExecutiveEngine_1 = require("../core/engines/ExecutiveEngine");
const EventPipeline_1 = require("../core/messaging/EventPipeline");
const perf_hooks_1 = require("perf_hooks");
function measure() {
    return __awaiter(this, void 0, void 0, function* () {
        const startBoot = perf_hooks_1.performance.now();
        const core = JarvisCore_1.JarvisCore.getInstance();
        const pipe = EventPipeline_1.EventPipeline.getInstance();
        core.registerEngine(new IntentEngine_1.IntentEngine());
        core.registerEngine(new MissionPlanner_1.MissionPlanner());
        core.registerEngine(new MissionScheduler_1.MissionScheduler());
        core.registerEngine(new DecisionEngine_1.DecisionEngine());
        core.registerEngine(new WorkforceManager_1.WorkforceManager());
        core.registerEngine(new DepartmentRuntime_1.DepartmentRuntime('Marketing'));
        core.registerEngine(new DepartmentRuntime_1.DepartmentRuntime('Finance'));
        core.registerEngine(new DepartmentRuntime_1.DepartmentRuntime('Creative'));
        core.registerEngine(new DepartmentRuntime_1.DepartmentRuntime('Sales'));
        core.registerEngine(new ExecutiveEngine_1.ExecutiveEngine());
        let trace = [];
        pipe.subscribe('*', e => {
            trace.push(e.type + ' -> ' + e.intent + ' (' + e.sender + ')');
            if (e.type === 'MISSION_COMPLETED') {
                const endMission = perf_hooks_1.performance.now();
                console.log('--- EVENT TRACE ---');
                console.log(trace.join('\n'));
                console.log('--- METRICS ---');
                console.log('Startup Time:', (endBoot - startBoot).toFixed(2), 'ms');
                console.log('Mission Execution Time:', (endMission - startMission).toFixed(2), 'ms');
                console.log('Memory Usage (Heap Used):', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2), 'MB');
                process.exit(0);
            }
        });
        yield core.boot();
        const endBoot = perf_hooks_1.performance.now();
        const startMission = perf_hooks_1.performance.now();
        yield core.dispatchCommand('Launch SpiceNest nationwide');
    });
}
measure();
