import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Payment } from '@/billing/domain/model/payment.entity.js';


export class PaymentAssembler extends BaseAssembler {
    toEntityFromResource(resource) {
        return new Payment({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            planId: entity.planId,
            amount: entity.amount.amount,
            currency: entity.amount.currency,
            provider: entity.provider,
            reference: entity.reference,
            status: entity.status,
            cardBrand: entity.cardBrand,
            cardLast4: entity.cardLast4,
            paidAt: entity.paidAt.toISOString()
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
