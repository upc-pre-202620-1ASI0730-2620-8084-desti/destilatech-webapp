import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Order } from '@/orders-replenishment/domain/model/order.entity.js';

export class OrderAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Order({ ...resource });
    }


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
