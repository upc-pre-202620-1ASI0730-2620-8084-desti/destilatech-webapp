import { DateTime } from '@/shared/domain/model/date-time.js';


export const ReplenishmentStatus = Object.freeze({
    REQUESTED: 'REQUESTED',
    RECEIVED: 'RECEIVED',
    CANCELLED: 'CANCELLED'
});


export class ReplenishmentOrder {

    constructor({
                    id = null, userId, code = '', supplierName = '', supplierContact = '', productId, productName = '', quantity,
                    orderDate = new Date(), expectedDate = null, receivedDate = null, status = ReplenishmentStatus.REQUESTED, notes = ''
                }) {
        if (!userId) throw new Error('Replenishment order must belong to an account');
        if (!supplierName.trim()) throw new Error('supplier-required');
        if (!productId) throw new Error('product-required');
        if (!(Number(quantity) > 0)) throw new Error('quantity-required');
        this.id = id;
        this.userId = userId;
        this.code = code;
        this.supplierName = supplierName.trim();
        this.supplierContact = supplierContact;
        this.productId = productId;
        this.productName = productName;
        this.quantity = Number(quantity);
        this.orderDate = new DateTime(orderDate);
        this.expectedDate = expectedDate ? new DateTime(expectedDate) : null;
        this.receivedDate = receivedDate ? new DateTime(receivedDate) : null;
        this.status = status;
        this.notes = notes;
    }

    isPending() {
        return this.status === ReplenishmentStatus.REQUESTED;
    }

    receive() {
        if (!this.isPending()) throw new Error('replenishment-closed');
        this.status = ReplenishmentStatus.RECEIVED;
        this.receivedDate = new DateTime();
    }

    cancel() {
        if (!this.isPending()) throw new Error('replenishment-closed');
        this.status = ReplenishmentStatus.CANCELLED;
    }
}
