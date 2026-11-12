import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { ProductionBatch } from '@/production-monitoring/domain/model/production-batch.entity.js';
import { toUtcDate } from '@/shared/infrastructure/utc-date.js';


export class ProductionBatchAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new ProductionBatch({
            ...resource,
            productId: resource.productId ?? null,
            startDate: toUtcDate(resource.startDate),
            stageHistory: (resource.stageHistory ?? []).map(change => ({
                stage: change.stage,
                changedAt: toUtcDate(change.changedAt),
                notes: change.notes ?? ''
            }))
        });
    }


    /** Body of `POST /batches`. The server keeps the stage and its history. */
    toResourceFromEntity(entity) {
        return {
            code: entity.code,
            variety: entity.variety,
            startDate: entity.startDate.toISOString(),
            estimatedQuantity: entity.estimatedQuantity,
            tank: entity.tank,
            notes: entity.notes
        };
    }
}
