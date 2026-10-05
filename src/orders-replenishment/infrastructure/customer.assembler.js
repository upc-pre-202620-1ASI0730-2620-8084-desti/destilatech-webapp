import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Customer } from '@/orders-replenishment/domain/model/customer.entity.js';


export class CustomerAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Customer({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            name: entity.name,
            contactName: entity.contactName,
            phone: entity.phone,
            email: entity.email,
            address: entity.address,
            customerType: entity.customerType
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
