import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { ReplenishmentOrder } from '@/orders-replenishment/domain/model/replenishment-order.entity.js';


export class ReplenishmentOrderAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new ReplenishmentOrder({ ...resource, userId: resource.tenantId });
    }


    /** Body of `POST /replenishment-orders`. The server assigns the code, the date and the product name. */
    toResourceFromEntity(entity) {
        return {
            supplierName: entity.supplierName,
            supplierContact: entity.supplierContact,
            productId: entity.productId,
            quantity: entity.quantity,
            expectedDate: entity.expectedDate ? entity.expectedDate.toISOString() : null,
            notes: entity.notes
        };
    }
}
