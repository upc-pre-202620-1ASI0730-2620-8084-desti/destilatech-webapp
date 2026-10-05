import { DateTime } from '@/shared/domain/model/date-time.js';
import { Money } from '@/shared/domain/model/money.js';

export const PaymentProvider = Object.freeze({
    STRIPE: 'STRIPE'
});


export const PaymentStatus = Object.freeze({
    PAID: 'PAID',
    REFUNDED: 'REFUNDED'
});


export class Payment {

    constructor({ id = null, userId, planId, amount, currency = 'PEN', provider = PaymentProvider.STRIPE, reference, status = PaymentStatus.PAID, cardBrand = '', cardLast4 = '', paidAt = new Date() }) {
        if (!reference) throw new Error('Payment must have a gateway reference');
        this.id = id;
        this.userId = userId;
        this.planId = planId;
        this.amount = amount instanceof Money ? amount : new Money(amount, currency);
        this.provider = provider;
        this.reference = reference;
        this.status = status;
        this.cardBrand = cardBrand;
        this.cardLast4 = cardLast4;
        this.paidAt = new DateTime(paidAt);
    }


    static fromConfirmedCheckout(checkoutSession) {
        if (!checkoutSession.paid) throw new Error('payment-not-completed');
        return new Payment({
            userId: checkoutSession.userId,
            planId: checkoutSession.planId,
            amount: checkoutSession.amount,
            currency: checkoutSession.currency,
            reference: checkoutSession.id,
            cardBrand: checkoutSession.cardBrand,
            cardLast4: checkoutSession.cardLast4
        });
    }

    get maskedCard() {
        return this.cardLast4 ? `${this.cardBrand.toUpperCase()} •••• ${this.cardLast4}` : '';
    }
}
