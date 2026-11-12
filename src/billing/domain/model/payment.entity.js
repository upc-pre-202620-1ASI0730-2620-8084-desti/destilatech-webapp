import { DateTime } from '@/shared/domain/model/date-time.js';
import { Money } from '@/shared/domain/model/money.js';

export const PaymentProvider = Object.freeze({
    STRIPE: 'STRIPE'
});


export const PaymentStatus = Object.freeze({
    PAID: 'PAID',
    FAILED: 'FAILED'
});


/**
 * Payment registered by the platform after a paid Stripe Checkout session.
 * Only the card brand and its last 4 digits are kept, never the full card number.
 */
export class Payment {

    constructor({ id = null, userId, planId, amount, currency = 'PEN', provider = PaymentProvider.STRIPE, reference, status = PaymentStatus.PAID, cardBrand = '', cardLast4 = '', paidAt = new Date() }) {
        if (!reference) throw new Error('Payment must have a reference');
        this.id = id;
        this.userId = userId;
        this.planId = planId;
        this.amount = amount instanceof Money ? amount : new Money(amount, currency);
        this.provider = provider;
        this.reference = reference;
        this.status = status;
        this.cardBrand = cardBrand ?? '';
        this.cardLast4 = cardLast4 ?? '';
        this.paidAt = new DateTime(paidAt);
    }

    get maskedCard() {
        return this.cardLast4 ? `${this.cardBrand.toUpperCase()} •••• ${this.cardLast4}` : '';
    }
}
