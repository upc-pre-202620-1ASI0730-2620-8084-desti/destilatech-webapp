import { MovementReason, MovementType } from '@/inventory-stock/domain/model/stock-movement.entity.js';

export class RegisterStockMovementCommand {

    constructor({ productId, type, quantity, reason = MovementReason.ADJUSTMENT, notes = '', reference = '' }) {
        if (!productId) throw new Error('Product is required');
        if (!Object.values(MovementType).includes(type)) throw new Error('Movement type is required');
        if (!(Number(quantity) > 0)) throw new Error('Quantity must be greater than zero');
        this.productId = productId;
        this.type = type;
        this.quantity = Number(quantity);
        this.reason = reason;
        this.notes = notes;
        this.reference = reference;
    }
}
