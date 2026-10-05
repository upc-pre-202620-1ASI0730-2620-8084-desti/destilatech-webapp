/**
 * Process variables that can be monitored by IoT sensors, with their unit
 * and a default normal range used when a batch is registered.
 * @readonly
 */
export const VariableType = Object.freeze({
    TEMPERATURE: 'TEMPERATURE',
    PH: 'PH',
    HUMIDITY: 'HUMIDITY',
    DENSITY: 'DENSITY',
    BRIX: 'BRIX',
    ALCOHOL: 'ALCOHOL'
});

/** @type {Readonly<Record<string, {unit: string, minRange: number, maxRange: number, decimals: number}>>} */
export const VARIABLE_DEFAULTS = Object.freeze({
    [VariableType.TEMPERATURE]: { unit: '°C', minRange: 16, maxRange: 24, decimals: 1 },
    [VariableType.PH]: { unit: 'pH', minRange: 3.1, maxRange: 3.8, decimals: 2 },
    [VariableType.HUMIDITY]: { unit: '%', minRange: 55, maxRange: 75, decimals: 0 },
    [VariableType.DENSITY]: { unit: 'g/ml', minRange: 0.99, maxRange: 1.09, decimals: 3 },
    [VariableType.BRIX]: { unit: '°Bx', minRange: 0, maxRange: 24, decimals: 1 },
    [VariableType.ALCOHOL]: { unit: '% vol', minRange: 38, maxRange: 48, decimals: 1 }
});

/** Variables created by default for every new batch (as in the IoT monitoring mock-up). */
export const DEFAULT_BATCH_VARIABLES = Object.freeze([
    VariableType.TEMPERATURE, VariableType.PH, VariableType.HUMIDITY, VariableType.DENSITY
]);

/**
 * Process variable monitored for a batch, with its normal range (US10).
 */
export class ProcessVariable {
    /**
     * @param {Object} props
     * @param {number|null} [props.id]
     * @param {number} props.batchId
     * @param {number} props.userId
     * @param {string} props.type - {@link VariableType}
     * @param {number} [props.minRange]
     * @param {number} [props.maxRange]
     * @param {string} [props.sensorId] - Identifier of the (simulated) IoT sensor.
     */
    constructor({ id = null, batchId, userId, type, minRange, maxRange, sensorId = '' }) {
        if (!Object.values(VariableType).includes(type)) throw new Error(`Unsupported variable type: ${type}`);
        const defaults = VARIABLE_DEFAULTS[type];
        this.id = id;
        this.batchId = batchId;
        this.userId = userId;
        this.type = type;
        this.unit = defaults.unit;
        this.decimals = defaults.decimals;
        this.minRange = Number(minRange ?? defaults.minRange);
        this.maxRange = Number(maxRange ?? defaults.maxRange);
        this.sensorId = sensorId;
        if (this.minRange >= this.maxRange) throw new Error('invalid-range');
    }

    /**
     * Configures the normal range (command `ConfigureVariableRange`).
     * @param {number} minRange
     * @param {number} maxRange
     * @throws {Error} 'invalid-range' if min is not lower than max.
     */
    configureRange(minRange, maxRange) {
        if (!(Number(minRange) < Number(maxRange))) throw new Error('invalid-range');
        this.minRange = Number(minRange);
        this.maxRange = Number(maxRange);
    }

    /**
     * @param {number} value
     * @returns {boolean}
     */
    isWithinRange(value) {
        return value >= this.minRange && value <= this.maxRange;
    }

    /**
     * @param {number} value
     * @returns {string} Value rounded to the variable precision.
     */
    formatValue(value) {
        return Number(value).toFixed(this.decimals);
    }
}
