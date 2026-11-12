import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { StockMovement } from '@/inventory-stock/domain/model/stock-movement.entity.js';
import { toUtcDate } from '@/shared/infrastructure/utc-date.js';


export class StockMovementAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new StockMovement({ ...resource, movementDate: toUtcDate(resource.movementDate) });
    }


    /** Body of `POST /stock-movements`. The server sets the date and the stock item. */
    toResourceFromEntity(entity) {
        return {
            productId: entity.productId,
            type: entity.type,
            reason: entity.reason,
            quantity: entity.quantity,
            notes: entity.notes,
            reference: entity.reference
        };
    }
}
