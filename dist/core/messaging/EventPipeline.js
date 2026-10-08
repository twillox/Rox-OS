"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPipeline = void 0;
class EventPipeline {
    constructor() {
        this.subscribers = new Map();
        this.history = [];
    }
    static getInstance() {
        if (!EventPipeline.instance) {
            EventPipeline.instance = new EventPipeline();
        }
        return EventPipeline.instance;
    }
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        this.subscribers.get(eventType).add(callback);
        return () => {
            var _a;
            (_a = this.subscribers.get(eventType)) === null || _a === void 0 ? void 0 : _a.delete(callback);
        };
    }
    dispatch(event) {
        const fullEvent = Object.assign(Object.assign({}, event), { id: crypto.randomUUID(), timestamp: Date.now() });
        this.history.push(fullEvent);
        const specificListeners = this.subscribers.get(fullEvent.type);
        if (specificListeners) {
            specificListeners.forEach(cb => {
                try {
                    cb(fullEvent);
                }
                catch (e) {
                    console.error(`Error in event listener for ${fullEvent.type}`, e);
                }
            });
        }
        const allListeners = this.subscribers.get('*');
        if (allListeners) {
            allListeners.forEach(cb => {
                try {
                    cb(fullEvent);
                }
                catch (e) {
                    console.error(`Error in wildcard event listener`, e);
                }
            });
        }
        return fullEvent;
    }
    getHistory() {
        return [...this.history];
    }
}
exports.EventPipeline = EventPipeline;
