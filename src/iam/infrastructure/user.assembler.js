import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { User } from '@/iam/domain/model/user.entity.js';

export class UserAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new User({
            id: resource.id,
            fullName: resource.fullName,
            email: resource.email,
            businessName: resource.businessName,
            businessType: resource.businessType,
            createdAt: resource.createdAt,
            trialPeriod: resource.trialPeriod,
            accessGrantedUntil: resource.accessGrantedUntil,
            preferredPlanCode: resource.preferredPlanCode
        });
    }


    toResourceFromEntity(entity) {
        return {
            id: entity.id,
            fullName: entity.fullName,
            email: entity.email,
            businessName: entity.businessName,
            businessType: entity.businessType,
            createdAt: entity.createdAt.toISOString(),
            trialPeriod: {
                startDate: entity.trialPeriod.startDate.toISOString(),
                endDate: entity.trialPeriod.endDate.toISOString()
            },
            accessGrantedUntil: entity.accessGrantedUntil ? entity.accessGrantedUntil.toISOString() : null,
            preferredPlanCode: entity.preferredPlanCode
        };
    }
}
