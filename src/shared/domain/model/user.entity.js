import { BusinessType, isValidBusinessType } from '@/shared/domain/model/business-type.js';
import { TrialPeriod } from '@/shared/domain/model/trial-period.entity.js';
import { DateTime } from '@/shared/domain/model/date-time.js';

export class User {
    constructor({
                    id = null,
                    fullName = '',
                    email = '',
                    businessName = '',
                    businessType = BusinessType.PRODUCER,
                    createdAt = new Date(),
                    trialPeriod,
                    accessGrantedUntil = null,
                    preferredPlanCode = null
                }) {
        if (!fullName.trim()) throw new Error('User full name is required');
        if (!email.includes('@')) throw new Error('User email must be valid');
        if (!isValidBusinessType(businessType)) throw new Error(`Unsupported business type: ${businessType}`);

        this.id = id;
        this.fullName = fullName.trim();
        this.email = email.trim().toLowerCase();
        this.businessName = businessName;
        this.businessType = businessType;
        this.createdAt = new DateTime(createdAt);
        this.trialPeriod = trialPeriod instanceof TrialPeriod ? trialPeriod : new TrialPeriod(trialPeriod);
        this.accessGrantedUntil = accessGrantedUntil ? new DateTime(accessGrantedUntil) : null;
        this.preferredPlanCode = preferredPlanCode;
    }


    isProducer() {
        return this.businessType === BusinessType.PRODUCER;
    }

    isRetailer() {
        return this.businessType === BusinessType.RETAILER;
    }


    hasPaidAccess() {
        return this.accessGrantedUntil !== null && this.accessGrantedUntil.isFuture();
    }

    hasActiveAccess() {
        return this.hasPaidAccess() || !this.trialPeriod.isExpired();
    }


    extendAccessUntil(until) {
        this.accessGrantedUntil = new DateTime(until);
    }

    get initials() {
        return this.fullName.split(' ').filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('');
    }
}
