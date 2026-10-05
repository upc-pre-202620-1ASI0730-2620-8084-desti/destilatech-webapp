import { Money } from '@/shared/domain/model/money.js';

export class OrderLine {

    constructor({ productId, productName = '', quantity, unitPrice = 0 }) {
        if (!productId) throw new Error('Order line must reference a product');
        if (!(Number(quantity) > 0)) throw new Error('Order line quantity must be greater than zero');
        this.productId = productId;
        this.productName = productName;
        this.quantity = Number(quantity);
        this.unitPrice = unitPrice instanceof Money ? unitPrice : new Money(unitPrice);
        Object.freeze(this);
    }

    get subtotal() {
        return this.unitPrice.multiply(this.quantity);
    }
}
