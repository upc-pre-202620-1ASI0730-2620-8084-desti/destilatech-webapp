import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { StockItem } from '@/inventory-stock/domain/model/stock-item.entity.js';


export class StockItemAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new StockItem({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            productId: entity.productId,
            userId: entity.userId,
            currentQuantity: entity.currentQuantity,
            lowStockThreshold: entity.lowStockThreshold
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
