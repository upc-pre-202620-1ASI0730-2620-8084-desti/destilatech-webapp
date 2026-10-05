import { DateTime } from '@/shared/domain/model/date-time.js';

/**
 * Value captured by an IoT sensor for a process variable (simulated in the MVP).
 */
export class SensorReading {
    /**
     * @param {Object} props
     * @param {number|null} [props.id]
     * @param {number} props.processVariableId
     * @param {number} props.batchId
     * @param {number} props.userId
     * @param {number} props.value
     * @param {boolean} [props.withinRange]
     * @param {string|Date} [props.recordedAt]
     */
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

    /**
     * Records a reading and evaluates it against the variable range
     * (policy `EvaluateReadingAgainstRange`).
     *
     * @param {import('./process-variable.entity.js').ProcessVariable} variable
     * @param {number} value
     * @returns {SensorReading}
     */
    static record(variable, value) {
        return new SensorReading({
            processVariableId: variable.id,
            batchId: variable.batchId,
            userId: variable.userId,
            value,
            withinRange: variable.isWithinRange(value)
        });
    }

    /** @returns {boolean} True when the reading is an anomaly. */
    isAnomaly() {
        return !this.withinRange;
    }
}
