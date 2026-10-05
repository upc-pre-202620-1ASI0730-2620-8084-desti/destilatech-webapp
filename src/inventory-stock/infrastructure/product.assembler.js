import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Product } from '@/inventory-stock/domain/model/product.entity.js';


export class ProductAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Product({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            name: entity.name,
            presentation: entity.presentation,
            unit: entity.unit,
            category: entity.category,
            unitPrice: entity.unitPrice.amount,
            sku: entity.sku
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
