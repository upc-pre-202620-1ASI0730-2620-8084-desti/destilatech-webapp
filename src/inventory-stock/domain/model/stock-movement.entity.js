import { DateTime } from '@/shared/domain/model/date-time.js';


export const MovementType = Object.freeze({
    IN: 'IN',
    OUT: 'OUT'
});


export const MovementReason = Object.freeze({
    PURCHASE: 'PURCHASE',
    PRODUCTION: 'PRODUCTION',
    SALE: 'SALE',
    ORDER: 'ORDER',
    RETURN: 'RETURN',
    ADJUSTMENT: 'ADJUSTMENT',
    WASTE: 'WASTE',
    INITIAL: 'INITIAL'
});


export class StockMovement {

    constructor({ id = null, stockItemId, productId, userId, type, quantity, reason = MovementReason.ADJUSTMENT, notes = '', reference = '', movementDate = new Date() }) {
        if (!Object.values(MovementType).includes(type)) throw new Error(`Unsupported movement type: ${type}`);
        if (!(Number(quantity) > 0)) throw new Error('Movement quantity must be greater than zero');
        this.id = id;
        this.stockItemId = stockItemId;
        this.productId = productId;
        this.userId = userId;
        this.type = type;
        this.quantity = Number(quantity);
        this.reason = reason;
        this.notes = notes;
        this.reference = reference;
        this.movementDate = new DateTime(movementDate);
    }

    get signedQuantity() {
        return this.type === MovementType.IN ? this.quantity : -this.quantity;
    }

    isExit() {
        return this.type === MovementType.OUT;
    }
}
