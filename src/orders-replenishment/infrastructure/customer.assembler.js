import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Customer } from '@/orders-replenishment/domain/model/customer.entity.js';


export class CustomerAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Customer({ ...resource, userId: resource.tenantId });
    }


    /** Body of `POST /customers` and `PUT /customers/{id}`. */
    toResourceFromEntity(entity) {
        return {
            name: entity.name,
            contactName: entity.contactName,
            phone: entity.phone,
            email: entity.email,
            address: entity.address,
            customerType: entity.customerType
        };
    }
}
