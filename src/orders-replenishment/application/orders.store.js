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
import { useUserStore } from '@/shared/application/user.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';

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
        const userStore = useUserStore();
        errors.value = [];
        loading.value = true;
        try {
            const [customersResponse, ordersResponse, replenishmentResponse] = await Promise.all([
                ordersApi.getCustomersByUserId(userStore.currentUserId),
                ordersApi.getOrdersByUserId(userStore.currentUserId),
                ordersApi.getReplenishmentOrdersByUserId(userStore.currentUserId)
            ]);
            const newestFirst = (first, second) => second.orderDate.toDate() - first.orderDate.toDate();
            customers.value = customerAssembler.toEntitiesFromResponse(customersResponse)
                .sort((first, second) => first.name.localeCompare(second.name));
            orders.value = orderAssembler.toEntitiesFromResponse(ordersResponse).sort(newestFirst);
            replenishmentOrders.value = replenishmentAssembler.toEntitiesFromResponse(replenishmentResponse).sort(newestFirst);
            loaded.value = true;
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    async function saveCustomer(data) {
        const userStore = useUserStore();
        errors.value = [];
        try {
            const customer = new Customer({ ...data, userId: userStore.currentUserId });
            const resource = customerAssembler.toResourceFromEntity(customer);
            const response = customer.id
                ? await ordersApi.updateCustomer(userStore.currentUserId, customer.id, resource)
                : await ordersApi.createCustomer(userStore.currentUserId, resource);
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

    async function registerOrder(command) {
        const userStore = useUserStore();
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
                userId: userStore.currentUserId,
                customerId: command.customerId,
                customerName: customer?.name ?? '',
                lines,
                notes: command.notes ?? ''
            });
            const response = await ordersApi.createOrder(userStore.currentUserId, orderAssembler.toResourceFromEntity(order));
            const createdOrder = orderAssembler.toEntityFromResponse(response);
            orders.value = [createdOrder, ...orders.value];

            // The platform discounted the stock of each product.
            await inventoryStore.fetchInventory({ force: true });
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
            await ordersApi.updateOrderStatus(order.userId, order.id, order.status);
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
            await ordersApi.updateOrderStatus(order.userId, order.id, order.status);

            // The platform returned the units of the order to the stock.
            await inventoryStore.fetchInventory({ force: true });
            return true;
        } catch (error) {
            order.status = previousStatus;
            errors.value.push(toErrorMessage(error));
            return false;
        }
    }


    async function requestReplenishment(command) {
        const userStore = useUserStore();
        const inventoryStore = useInventoryStore();
        errors.value = [];
        try {
            const product = inventoryStore.products.find(item => item.id === command.productId);
            const replenishment = new ReplenishmentOrder({
                ...command,
                userId: userStore.currentUserId,
                productName: product?.displayName ?? ''
            });
            const response = await ordersApi.createReplenishmentOrder(userStore.currentUserId,
                replenishmentAssembler.toResourceFromEntity(replenishment));
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
            const response = await ordersApi.updateReplenishmentOrderStatus(replenishment.userId, replenishment.id,
                replenishment.status);
            Object.assign(replenishment, replenishmentAssembler.toEntityFromResponse(response));

            // The platform added the received units to the stock.
            await inventoryStore.fetchInventory({ force: true });
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
            await ordersApi.updateReplenishmentOrderStatus(replenishment.userId, replenishment.id, replenishment.status);
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
