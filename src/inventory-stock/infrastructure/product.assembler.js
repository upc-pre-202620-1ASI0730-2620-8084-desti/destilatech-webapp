import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Product } from '@/inventory-stock/domain/model/product.entity.js';


export class ProductAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Product({ ...resource, userId: resource.tenantId });
    }


    /** Body of `PUT /products/{id}` (and of `POST /products`, plus the low stock threshold). */
    toResourceFromEntity(entity) {
        return {
            name: entity.name,
            presentation: entity.presentation,
            unit: entity.unit,
            category: entity.category,
            unitPrice: entity.unitPrice.amount,
            sku: entity.sku
        };
    }
}
