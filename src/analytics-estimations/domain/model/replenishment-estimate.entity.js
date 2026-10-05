import { DateTime } from '@/shared/domain/model/date-time.js';

export const ANALYSIS_WINDOW_DAYS = 30;

export const COVERAGE_DAYS = 30;

export const MIN_EXIT_MOVEMENTS = 3;

const CONSUMPTION_REASONS = Object.freeze(['SALE', 'ORDER', 'WASTE']);


export class ReplenishmentEstimate {

    constructor({ productId, hasEnoughData, averageDailyConsumption = 0, daysUntilThreshold = null, estimatedDate = null, suggestedQuantity = 0, confidence = 0, exitsAnalyzed = 0 }) {
        this.productId = productId;
        this.hasEnoughData = hasEnoughData;
        this.averageDailyConsumption = averageDailyConsumption;
        this.daysUntilThreshold = daysUntilThreshold;
        this.estimatedDate = estimatedDate;
        this.suggestedQuantity = suggestedQuantity;
        this.confidence = confidence;
        this.exitsAnalyzed = exitsAnalyzed;
    }


    static calculate({ productId, currentQuantity, lowStockThreshold, movements, now = new Date() }) {
        const windowStart = new DateTime(now).plusDays(-ANALYSIS_WINDOW_DAYS).valueOf();
        const exits = movements.filter(movement =>
            movement.type === 'OUT' && CONSUMPTION_REASONS.includes(movement.reason) && movement.date.getTime() >= windowStart);

        if (exits.length < MIN_EXIT_MOVEMENTS) {
            return new ReplenishmentEstimate({ productId, hasEnoughData: false, exitsAnalyzed: exits.length });
        }

        const consumed = exits.reduce((sum, movement) => sum + movement.quantity, 0);
        const averageDailyConsumption = consumed / ANALYSIS_WINDOW_DAYS;
        const unitsAboveThreshold = currentQuantity - lowStockThreshold;
        const daysUntilThreshold = unitsAboveThreshold <= 0 ? 0 : Math.floor(unitsAboveThreshold / averageDailyConsumption);
        const suggestedQuantity = Math.max(0, Math.ceil(averageDailyConsumption * COVERAGE_DAYS + lowStockThreshold - currentQuantity));

        return new ReplenishmentEstimate({
            productId,
            hasEnoughData: true,
            averageDailyConsumption: Math.round(averageDailyConsumption * 100) / 100,
            daysUntilThreshold,
            estimatedDate: new DateTime(now).plusDays(daysUntilThreshold),
            suggestedQuantity,
            confidence: Math.min(1, exits.length / 10),
            exitsAnalyzed: exits.length
        });
    }

    isUrgent() {
        return this.hasEnoughData && this.daysUntilThreshold !== null && this.daysUntilThreshold <= 7;
    }
}
