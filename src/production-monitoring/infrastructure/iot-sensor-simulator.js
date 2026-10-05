/**
 * Simulated IoT sensor (external system "Sensor IoT (simulado)" of the context diagram).
 *
 * @remarks
 * Physical devices are out of the academic scope, so this adapter produces
 * realistic readings around the middle of each variable range, with a
 * configurable probability of an out-of-range value to exercise the
 * anomaly detection flow (US09, US11).
 */
export class IotSensorSimulator {
    /**
     * @param {number} [anomalyProbability=0.15] - Probability (0..1) of generating an anomaly.
     */
    constructor(anomalyProbability = 0.15) {
        this.anomalyProbability = anomalyProbability;
    }

    /**
     * Generates a reading value for a process variable.
     * @param {import('@/production-monitoring/domain/model/process-variable.entity.js').ProcessVariable} variable
     * @param {number|null} [previousValue] - Last value, to produce a smooth series.
     * @returns {number}
     */
    generateValue(variable, previousValue = null) {
        const span = variable.maxRange - variable.minRange;
        const center = (variable.minRange + variable.maxRange) / 2;

        if (Math.random() < this.anomalyProbability) {
            const outside = span * (0.08 + Math.random() * 0.2);
            const value = Math.random() < 0.5 ? variable.minRange - outside : variable.maxRange + outside;
            return Number(value.toFixed(variable.decimals));
        }

        const base = previousValue !== null && variable.isWithinRange(previousValue) ? previousValue : center;
        const drift = (Math.random() - 0.5) * span * 0.18;
        const pullToCenter = (center - base) * 0.25;
        const value = Math.min(variable.maxRange, Math.max(variable.minRange, base + drift + pullToCenter));
        return Number(value.toFixed(variable.decimals));
    }
}
