import { DateTime } from '@/shared/domain/model/date-time.js';
import { Money } from '@/shared/domain/model/money.js';
import { OrderLine } from '@/orders-replenishment/domain/model/order-line.js';

export const OrderStatus = Object.freeze({
    PENDING: 'PENDING',
    PREPARING: 'PREPARING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
});

const STATUS_FLOW = Object.freeze([OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]);


export class Order {

    constructor({ id = null, userId, code = '', customerId, customerName = '', orderDate = new Date(), status = OrderStatus.PENDING, lines = [], notes = '' }) {
        if (!userId) throw new Error('Order must belong to an account');
        if (!customerId) throw new Error('customer-required');
        if (!lines.length) throw new Error('lines-required');
        if (!Object.values(OrderStatus).includes(status)) throw new Error(`Unsupported order status: ${status}`);
        this.id = id;
        this.userId = userId;
        this.code = code;
        this.customerId = customerId;
        this.customerName = customerName;
        this.orderDate = new DateTime(orderDate);
        this.status = status;
        this.lines = lines.map(line => line instanceof OrderLine ? line : new OrderLine(line));
        this.notes = notes;
    }

    get total() {
        return this.lines.reduce((sum, line) => sum.add(line.subtotal), new Money(0));
    }

    get totalUnits() {
        return this.lines.reduce((sum, line) => sum + line.quantity, 0);
    }

    get nextStatus() {
        const index = STATUS_FLOW.indexOf(this.status);
        return index >= 0 && index < STATUS_FLOW.length - 1 ? STATUS_FLOW[index + 1] : null;
    }

    isOpen() {
        return this.status !== OrderStatus.DELIVERED && this.status !== OrderStatus.CANCELLED;
    }

    advanceStatus() {
        const next = this.nextStatus;
        if (!next) throw new Error('order-closed');
        this.status = next;
    }


    cancel() {
        if (!this.isOpen()) throw new Error('order-closed');
        this.status = OrderStatus.CANCELLED;
    }
}
