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
exports.JarvisCore = void 0;
const EventPipeline_1 = require("../messaging/EventPipeline");
class JarvisCore {
    constructor() {
        this.engines = new Map();
        this.isBooted = false;
        this.eventPipeline = EventPipeline_1.EventPipeline.getInstance();
    }
    static getInstance() {
        if (!JarvisCore.instance) {
            JarvisCore.instance = new JarvisCore();
        }
        return JarvisCore.instance;
    }
    registerEngine(engine) {
        this.engines.set(engine.name, engine);
        this.eventPipeline.subscribe('*', (event) => {
            engine.observe([event]);
        });
    }
    getEngine(name) {
        return this.engines.get(name);
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isBooted)
                return;
            this.eventPipeline.dispatch({
                type: 'SYSTEM_LOG',
                sender: 'JarvisCore',
                receiver: 'all',
                intent: 'BOOT_SEQUENCE_START',
                payload: { message: 'Initializing OS Kernel...' },
                priority: 'high',
                status: 'processing'
            });
            for (const engine of this.engines.values()) {
                yield engine.initialize();
                this.eventPipeline.dispatch({
                    type: 'SYSTEM_LOG',
                    sender: 'JarvisCore',
                    receiver: 'all',
                    intent: 'ENGINE_INITIALIZED',
                    payload: { engine: engine.name },
                    priority: 'normal',
                    status: 'completed'
                });
            }
            this.isBooted = true;
            this.eventPipeline.dispatch({
                type: 'SYSTEM_LOG',
                sender: 'JarvisCore',
                receiver: 'all',
                intent: 'BOOT_SEQUENCE_COMPLETE',
                payload: { message: 'Roxten OS Ready.' },
                priority: 'high',
                status: 'completed'
            });
        });
    }
    dispatchCommand(objective) {
        return __awaiter(this, void 0, void 0, function* () {
            const missionId = crypto.randomUUID();
            this.eventPipeline.dispatch({
                type: 'INTENT_DETECTED',
                missionId,
                sender: 'CEO',
                receiver: 'IntentEngine',
                intent: 'NEW_MISSION',
                payload: { objective },
                priority: 'high',
                status: 'completed'
            });
            return missionId;
        });
    }
}
exports.JarvisCore = JarvisCore;
