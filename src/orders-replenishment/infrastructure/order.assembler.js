import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Order } from '@/orders-replenishment/domain/model/order.entity.js';

/**
 * Maps order resources (with embedded lines) into {@link Order} entities and back.
 */
export class OrderAssembler extends BaseAssembler {
    /**
     * @param {Object} resource
     * @returns {Order}
     */
    toEntityFromResource(resource) {
        return new Order({ ...resource });
    }

    /**
     * @param {Order} entity
     * @returns {Object}
     */
    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            code: entity.code,
            customerId: entity.customerId,
            customerName: entity.customerName,
            orderDate: entity.orderDate.toISOString(),
            status: entity.status,
            lines: entity.lines.map(line => ({
                productId: line.productId,
                productName: line.productName,
                quantity: line.quantity,
                unitPrice: line.unitPrice.amount
            })),
            total: entity.total.amount,
            notes: entity.notes
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
