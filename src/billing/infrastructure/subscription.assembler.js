import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Subscription } from '@/billing/domain/model/subscription.entity.js';


export class SubscriptionAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Subscription({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            planId: entity.planId,
            status: entity.status,
            startDate: entity.startDate.toISOString(),
            renewalDate: entity.renewalDate.toISOString(),
            paymentReference: entity.paymentReference
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
