import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { StockMovement } from '@/inventory-stock/domain/model/stock-movement.entity.js';


export class StockMovementAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new StockMovement({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            stockItemId: entity.stockItemId,
            productId: entity.productId,
            userId: entity.userId,
            type: entity.type,
            quantity: entity.quantity,
            reason: entity.reason,
            notes: entity.notes,
            reference: entity.reference,
            movementDate: entity.movementDate.toISOString()
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
