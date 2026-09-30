
export class Money {

    constructor(amount = 0, currency = 'PEN') {
        const value = Number(amount);
        if (Number.isNaN(value) || value < 0) throw new Error('Money amount must be a non-negative number');
        this.amount = Math.round(value * 100) / 100;
        this.currency = currency;
        Object.freeze(this);
    }


    add(other) {
        return new Money(this.amount + other.amount, this.currency);
    }

    multiply(factor) {
        return new Money(this.amount * factor, this.currency);
    }

    format() {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: this.currency }).format(this.amount);
    }
}
