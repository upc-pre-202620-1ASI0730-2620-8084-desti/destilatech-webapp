import { DateTime } from '@/shared/domain/model/date-time.js';


export class SensorReading {

    constructor({ id = null, processVariableId, batchId, userId, value, withinRange = true, recordedAt = new Date() }) {
        if (!processVariableId) throw new Error('Reading must reference a process variable');
        if (Number.isNaN(Number(value))) throw new Error('Reading value must be numeric');
        this.id = id;
        this.processVariableId = processVariableId;
        this.batchId = batchId;
        this.userId = userId;
        this.value = Number(value);
        this.withinRange = withinRange;
        this.recordedAt = new DateTime(recordedAt);
    }


    static record(variable, value) {
        return new SensorReading({
            processVariableId: variable.id,
            batchId: variable.batchId,
            userId: variable.userId,
            value,
            withinRange: variable.isWithinRange(value)
        });
    }

    isAnomaly() {
        return !this.withinRange;
    }
}
