import { MovementType } from '@/inventory-stock/domain/model/stock-movement.entity.js';

export const StockStatus = Object.freeze({
    OPTIMAL: 'OPTIMAL',
    LOW: 'LOW',
    CRITICAL: 'CRITICAL'
});


export class StockItem {

    constructor({ id = null, productId, userId, currentQuantity = 0, lowStockThreshold = 0 }) {
        if (!productId) throw new Error('Stock item must reference a product');
        if (Number(currentQuantity) < 0) throw new Error('Stock quantity cannot be negative');
        if (Number(lowStockThreshold) < 0) throw new Error('Low stock threshold cannot be negative');
        this.id = id;
        this.productId = productId;
        this.userId = userId;
        this.currentQuantity = Number(currentQuantity);
        this.lowStockThreshold = Number(lowStockThreshold);
    }


    canApply(movement) {
        return movement.type === MovementType.IN || movement.quantity <= this.currentQuantity;
    }


    applyMovement(movement) {
        if (!this.canApply(movement)) throw new Error('insufficient-stock');
        this.currentQuantity += movement.signedQuantity;
    }


    configureThreshold(threshold) {
        if (!(Number(threshold) >= 0)) throw new Error('Low stock threshold cannot be negative');
        this.lowStockThreshold = Number(threshold);
    }

    isBelowThreshold() {
        return this.lowStockThreshold > 0 && this.currentQuantity <= this.lowStockThreshold;
    }

    get status() {
        if (this.currentQuantity === 0 || (this.lowStockThreshold > 0 && this.currentQuantity <= this.lowStockThreshold / 2)) {
            return StockStatus.CRITICAL;
        }
        return this.isBelowThreshold() ? StockStatus.LOW : StockStatus.OPTIMAL;
    }
}
