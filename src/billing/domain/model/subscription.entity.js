import { DateTime } from '@/shared/domain/model/date-time.js';


export const SubscriptionStatus = Object.freeze({
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED'
});

export const BILLING_PERIOD_DAYS = 30;


export class Subscription {

    constructor({ id = null, userId, planId, status = SubscriptionStatus.ACTIVE, startDate = new Date(), renewalDate, paymentReference = null }) {
        if (!userId) throw new Error('Subscription must belong to an account');
        if (!planId) throw new Error('Subscription must reference a plan');
        this.id = id;
        this.userId = userId;
        this.planId = planId;
        this.status = status;
        this.startDate = new DateTime(startDate);
        this.renewalDate = renewalDate ? new DateTime(renewalDate) : this.startDate.plusDays(BILLING_PERIOD_DAYS);
        this.paymentReference = paymentReference;
    }


    static activate(userId, planId, paymentReference) {
        return new Subscription({ userId, planId, status: SubscriptionStatus.ACTIVE, startDate: new Date(), paymentReference });
    }

    isActive() {
        return this.status === SubscriptionStatus.ACTIVE && this.renewalDate.isFuture();
    }

    cancel() {
        this.status = SubscriptionStatus.CANCELLED;
    }
}
