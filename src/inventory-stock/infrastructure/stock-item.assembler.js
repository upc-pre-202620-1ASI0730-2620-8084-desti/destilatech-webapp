import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { StockItem } from '@/inventory-stock/domain/model/stock-item.entity.js';


/** Stock items are created by the server together with their product, so only the read side is needed. */
export class StockItemAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new StockItem({ ...resource, userId: resource.tenantId });
    }
}
