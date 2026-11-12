import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Order } from '@/orders-replenishment/domain/model/order.entity.js';


export class OrderAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Order({ ...resource });
    }


    /**
     * Body of `POST /orders`. The server assigns the code and the date, and takes the name and price of each
     * product from the inventory.
     */
    toResourceFromEntity(entity) {
        return {
            customerId: entity.customerId,
            lines: entity.lines.map(line => ({ productId: line.productId, quantity: line.quantity })),
            notes: entity.notes
        };
    }
}
