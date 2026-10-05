import { Money } from '@/shared/domain/model/money.js';


export const BillingCycle = Object.freeze({
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY'
});


export class Plan {

    constructor({ id, code, price, billingCycle = BillingCycle.MONTHLY, maxUsers = null, featureKeys = [], recommended = false }) {
        if (!code) throw new Error('Plan code is required');
        this.id = id;
        this.code = code;
        this.price = price instanceof Money ? price : new Money(price);
        this.billingCycle = billingCycle;
        this.maxUsers = maxUsers;
        this.featureKeys = featureKeys;
        this.recommended = recommended;
    }

    hasUnlimitedUsers() {
        return this.maxUsers === null;
    }
}
