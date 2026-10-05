import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { OrdersApi } from '@/orders-replenishment/infrastructure/orders-api.js';
import { CustomerAssembler } from '@/orders-replenishment/infrastructure/customer.assembler.js';
import { OrderAssembler } from '@/orders-replenishment/infrastructure/order.assembler.js';
import { ReplenishmentOrderAssembler } from '@/orders-replenishment/infrastructure/replenishment-order.assembler.js';
import { Customer } from '@/orders-replenishment/domain/model/customer.entity.js';
import { Order, OrderStatus } from '@/orders-replenishment/domain/model/order.entity.js';
import { OrderLine } from '@/orders-replenishment/domain/model/order-line.js';
import { ReplenishmentOrder } from '@/orders-replenishment/domain/model/replenishment-order.entity.js';
import { useIamStore } from '@/iam/application/iam.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { MovementReason } from '@/inventory-stock/domain/model/stock-movement.entity.js';

const ordersApi = new OrdersApi();
const customerAssembler = new CustomerAssembler();
const orderAssembler = new OrderAssembler();
const replenishmentAssembler = new ReplenishmentOrderAssembler();


const toErrorMessage = error => error instanceof Error ? error.message : String(error);

export const useOrdersStore = defineStore('orders', () => {
    const customers = ref([]);
    const orders = ref([]);
    const replenishmentOrders = ref([]);
    const errors = ref([]);
    const loading = ref(false);
    const loaded = ref(false);

    const openOrders = computed(() => orders.value.filter(order => order.isOpen()));
    const pendingReplenishments = computed(() => replenishmentOrders.value.filter(order => order.isPending()));


    const currentMonthSales = computed(() => {
        const now = new Date();
        return orders.value
            .filter(order => order.status !== OrderStatus.CANCELLED)
            .filter(order => {
                const date = order.orderDate.toDate();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            })
            .reduce((sum, order) => sum + order.total.amount, 0);
    });

    const ordersForCustomer = customerId => orders.value.filter(order => order.customerId === customerId);

    async function fetchOrders({ force = false } = {}) {
        if (loaded.value && !force) return;
        const iamStore = useIamStore();
        errors.value = [];
        loading.value = true;
        try {
            const [customersResponse, ordersResponse, replenishmentResponse] = await Promise.all([
                ordersApi.getCustomersByUserId(iamStore.currentUserId),
                ordersApi.getOrdersByUserId(iamStore.currentUserId),
                ordersApi.getReplenishmentOrdersByUserId(iamStore.currentUserId)
            ]);
            customers.value = customerAssembler.toEntitiesFromResponse(customersResponse);
            orders.value = orderAssembler.toEntitiesFromResponse(ordersResponse);
            replenishmentOrders.value = replenishmentAssembler.toEntitiesFromResponse(replenishmentResponse);
            loaded.value = true;
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    async function saveCustomer(data) {
        const iamStore = useIamStore();
        errors.value = [];
        try {
            const customer = new Customer({ ...data, userId: iamStore.currentUserId });
            const resource = customerAssembler.toResourceFromEntity(customer);
            const response = customer.id
                ? await ordersApi.updateCustomer(customer.id, resource)
                : await ordersApi.createCustomer(resource);
            const saved = customerAssembler.toEntityFromResponse(response);
            customers.value = customer.id
                ? customers.value.map(item => item.id === saved.id ? saved : item)
                : [...customers.value, saved].sort((first, second) => first.name.localeCompare(second.name));
            return saved;
        } catch (error) {
            errors.value.push(toErrorMessage(error));
            return null;
        }
    }

    function nextOrderCode() {
        const last = orders.value.map(order => Number(order.code.replace('#', '')) || 0).reduce((max, value) => Math.max(max, value), 1000);
        return `#${last + 1}`;
    }


    async function registerOrder(command) {
        const iamStore = useIamStore();
        const inventoryStore = useInventoryStore();
        errors.value = [];
        try {
            await inventoryStore.fetchInventory();
            const customer = customers.value.find(item => item.id === command.customerId);
            const lines = command.lines.map(line => {
                const item = inventoryStore.findInventoryItem(line.productId);
                if (!item) throw new Error('product-required');
                if (line.quantity > item.stockItem.currentQuantity) throw new Error('insufficient-stock');
                return new OrderLine({
                    productId: item.product.id,
                    productName: item.product.displayName,
                    quantity: line.quantity,
                    unitPrice: item.product.unitPrice
                });
            });
            const order = new Order({
                userId: iamStore.currentUserId,
                code: nextOrderCode(),
                customerId: command.customerId,
                customerName: customer?.name ?? '',
                lines,
                notes: command.notes ?? ''
            });
            const response = await ordersApi.createOrder(orderAssembler.toResourceFromEntity(order));
            const createdOrder = orderAssembler.toEntityFromResponse(response);
            orders.value = [createdOrder, ...orders.value];

            for (const line of createdOrder.lines) {
                await inventoryStore.discountStock(line.productId, line.quantity, createdOrder.code);
            }
            return createdOrder;
        } catch (error) {
            errors.value.push(toErrorMessage(error));
            return null;
        }
    }


    async function advanceOrderStatus(order) {
        errors.value = [];
        const previousStatus = order.status;
        try {
            order.advanceStatus();
            await ordersApi.patchOrder(order.id, { status: order.status });
            return true;
        } catch (error) {
            order.status = previousStatus;
            errors.value.push(toErrorMessage(error));
            return false;
        }
    }


    async function cancelOrder(order) {
        const inventoryStore = useInventoryStore();
        errors.value = [];
        const previousStatus = order.status;
        try {
            order.cancel();
            await ordersApi.patchOrder(order.id, { status: order.status });
            for (const line of order.lines) {
                await inventoryStore.addStock(line.productId, line.quantity, MovementReason.RETURN, order.code);
            }
            return true;
        } catch (error) {
            order.status = previousStatus;
            errors.value.push(toErrorMessage(error));
            return false;
        }
    }


    async function requestReplenishment(command) {
        const iamStore = useIamStore();
        const inventoryStore = useInventoryStore();
        errors.value = [];
        try {
            const product = inventoryStore.products.find(item => item.id === command.productId);
            const sequence = replenishmentOrders.value.length + 1;
            const replenishment = new ReplenishmentOrder({
                ...command,
                userId: iamStore.currentUserId,
                code: `RP-${String(sequence).padStart(4, '0')}`,
                productName: product?.displayName ?? ''
            });
            const response = await ordersApi.createReplenishmentOrder(replenishmentAssembler.toResourceFromEntity(replenishment));
            const created = replenishmentAssembler.toEntityFromResponse(response);
            replenishmentOrders.value = [created, ...replenishmentOrders.value];
            return created;
        } catch (error) {
            errors.value.push(toErrorMessage(error));
            return null;
        }
    }


    async function receiveReplenishment(replenishment) {
        const inventoryStore = useInventoryStore();
        errors.value = [];
        try {
            replenishment.receive();
            await ordersApi.patchReplenishmentOrder(replenishment.id, {
                status: replenishment.status,
                receivedDate: replenishment.receivedDate.toISOString()
            });
            await inventoryStore.addStock(replenishment.productId, replenishment.quantity, MovementReason.PURCHASE, replenishment.code);
            return true;
        } catch (error) {
            errors.value.push(toErrorMessage(error));
            return false;
        }
    }


    async function cancelReplenishment(replenishment) {
        errors.value = [];
        try {
            replenishment.cancel();
            await ordersApi.patchReplenishmentOrder(replenishment.id, { status: replenishment.status });
            return true;
        } catch (error) {
            errors.value.push(toErrorMessage(error));
            return false;
        }
    }

    return {
        customers,
        orders,
        replenishmentOrders,
        errors,
        loading,
        openOrders,
        pendingReplenishments,
        currentMonthSales,
        ordersForCustomer,
        fetchOrders,
        saveCustomer,
        registerOrder,
        advanceOrderStatus,
        cancelOrder,
        requestReplenishment,
        receiveReplenishment,
        cancelReplenishment
    };
});
