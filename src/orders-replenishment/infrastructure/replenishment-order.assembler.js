import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { ReplenishmentOrder } from '@/orders-replenishment/domain/model/replenishment-order.entity.js';

/**
 * Maps replenishment order resources into {@link ReplenishmentOrder} entities and back.
 */
export class ReplenishmentOrderAssembler extends BaseAssembler {
    /**
     * @param {Object} resource
     * @returns {ReplenishmentOrder}
     */
    toEntityFromResource(resource) {
        return new ReplenishmentOrder({ ...resource });
    }

    /**
     * @param {ReplenishmentOrder} entity
     * @returns {Object}
     */
    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            code: entity.code,
            supplierName: entity.supplierName,
            supplierContact: entity.supplierContact,
            productId: entity.productId,
            productName: entity.productName,
            quantity: entity.quantity,
            orderDate: entity.orderDate.toISOString(),
            expectedDate: entity.expectedDate ? entity.expectedDate.toISOString() : null,
            receivedDate: entity.receivedDate ? entity.receivedDate.toISOString() : null,
            status: entity.status,
            notes: entity.notes
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
