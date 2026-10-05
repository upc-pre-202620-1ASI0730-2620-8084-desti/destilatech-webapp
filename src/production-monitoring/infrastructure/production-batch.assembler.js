import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { ProductionBatch } from '@/production-monitoring/domain/model/production-batch.entity.js';


export class ProductionBatchAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new ProductionBatch({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            code: entity.code,
            variety: entity.variety,
            startDate: entity.startDate.toISOString(),
            estimatedQuantity: entity.estimatedQuantity,
            tank: entity.tank,
            stage: entity.stage,
            stageHistory: entity.stageHistory.map(change => ({
                stage: change.stage,
                changedAt: change.changedAt.toISOString(),
                notes: change.notes
            })),
            productId: entity.productId,
            bottledUnits: entity.bottledUnits,
            notes: entity.notes
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
