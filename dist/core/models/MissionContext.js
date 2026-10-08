"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissionContext = void 0;
class MissionContext {
    constructor(id, objective) {
        this.id = id;
        this.objective = objective;
        this.status = 'created';
        this.departmentsRequired = [];
        this.capabilitiesRequired = [];
    }
}
exports.MissionContext = MissionContext;
