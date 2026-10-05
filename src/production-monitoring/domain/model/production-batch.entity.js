import { DateTime } from '@/shared/domain/model/date-time.js';
import { BatchStage, BATCH_STAGE_SEQUENCE, nextStageOf } from '@/production-monitoring/domain/model/batch-stage.js';



export class ProductionBatch {

    constructor({
                    id = null,
                    userId,
                    code = '',
                    variety = '',
                    startDate,
                    estimatedQuantity = 0,
                    tank = '',
                    stage = BatchStage.RECEIVED,
                    stageHistory = [],
                    productId = null,
                    bottledUnits = 0,
                    notes = ''
                }) {
        if (!userId) throw new Error('Batch must belong to a producer');
        if (!startDate) throw new Error('Batch start date is required');
        if (!variety) throw new Error('Batch grape variety is required');
        if (!(Number(estimatedQuantity) > 0)) throw new Error('Batch estimated quantity must be greater than zero');
        if (!BATCH_STAGE_SEQUENCE.includes(stage)) throw new Error(`Unsupported batch stage: ${stage}`);

        this.id = id;
        this.userId = userId;
        this.code = code;
        this.variety = variety;
        this.startDate = new DateTime(startDate);
        this.estimatedQuantity = Number(estimatedQuantity);
        this.tank = tank;
        this.stage = stage;
        this.stageHistory = (stageHistory.length ? stageHistory : [{ stage, changedAt: startDate }])
            .map(change => ({ stage: change.stage, changedAt: new DateTime(change.changedAt), notes: change.notes ?? '' }));
        this.productId = productId;
        this.bottledUnits = Number(bottledUnits);
        this.notes = notes;
    }

    get nextStage() {
        return nextStageOf(this.stage);
    }

    isActive() {
        return this.stage !== BatchStage.BOTTLED;
    }

    isMonitored() {
        return [BatchStage.FERMENTATION, BatchStage.DISTILLATION, BatchStage.RESTING].includes(this.stage);
    }

    get stageIndex() {
        return BATCH_STAGE_SEQUENCE.indexOf(this.stage);
    }


    advanceStage(notes = '') {
        const next = this.nextStage;
        if (!next) throw new Error('batch-already-finished');
        this.stage = next;
        this.stageHistory.push({ stage: next, changedAt: new DateTime(), notes });
        return next;
    }


    registerBottling(units, productId) {
        if (this.stage !== BatchStage.BOTTLED) throw new Error('Only bottled batches can register bottled units');
        if (!(Number(units) >= 0)) throw new Error('Bottled units cannot be negative');
        this.bottledUnits = Number(units);
        this.productId = productId;
    }
}
