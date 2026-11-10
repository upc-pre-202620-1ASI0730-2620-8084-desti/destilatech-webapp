import { DateTime } from '@/shared/domain/model/date-time.js';
import { Money } from '@/shared/domain/model/money.js';

export const PaymentProvider = Object.freeze({
    SIMULATED: 'SIMULATED'
});


export const PaymentStatus = Object.freeze({
    PAID: 'PAID',
    REFUNDED: 'REFUNDED'
});


export const CardBrand = Object.freeze({
    VISA: 'visa',
    MASTERCARD: 'mastercard',
    AMEX: 'amex',
    CARD: 'card'
});


export class Payment {

    constructor({ id = null, userId, planId, amount, currency = 'PEN', provider = PaymentProvider.SIMULATED, reference, status = PaymentStatus.PAID, cardBrand = '', cardLast4 = '', paidAt = new Date() }) {
        if (!reference) throw new Error('Payment must have a reference');
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


    static fromSimulatedCard(userId, plan, cardNumber) {
        const digits = String(cardNumber).replace(/\D/g, '');
        if (!Payment.isValidCardNumber(digits)) throw new Error('invalid-card');
        return new Payment({
            userId,
            planId: plan.id,
            amount: plan.price,
            reference: `SIM-${Date.now()}`,
            cardBrand: Payment.detectCardBrand(digits),
            cardLast4: digits.slice(-4)
        });
    }


    static detectCardBrand(digits) {
        if (/^4/.test(digits)) return CardBrand.VISA;
        if (/^5[1-5]/.test(digits)) return CardBrand.MASTERCARD;
        if (/^3[47]/.test(digits)) return CardBrand.AMEX;
        return CardBrand.CARD;
    }


    static isValidCardNumber(digits) {
        if (!/^\d{13,19}$/.test(digits)) return false;
        let sum = 0;
        let double = false;
        for (let index = digits.length - 1; index >= 0; index--) {
            let digit = Number(digits[index]);
            if (double) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            double = !double;
        }
        return sum % 10 === 0;
    }

    get maskedCard() {
        return this.cardLast4 ? `${this.cardBrand.toUpperCase()} •••• ${this.cardLast4}` : '';
    }
}
