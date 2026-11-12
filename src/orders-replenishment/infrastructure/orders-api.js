import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const customersEndpointPath = import.meta.env.VITE_CUSTOMERS_ENDPOINT_PATH;
const ordersEndpointPath = import.meta.env.VITE_ORDERS_ENDPOINT_PATH;
const replenishmentOrdersEndpointPath = import.meta.env.VITE_REPLENISHMENT_ORDERS_ENDPOINT_PATH;


/**
 * Orders & Replenishment endpoints of the platform API.
 * Every request is scoped to the account with the `userId` query parameter. The platform updates the stock:
 * a new order discounts it, a cancelled order returns it and a received replenishment adds it.
 */
export class OrdersApi extends BaseApi {
    #customersEndpoint;
    #ordersEndpoint;
    #replenishmentOrdersEndpoint;

    constructor() {
        super();
        this.#customersEndpoint = new BaseEndpoint(this, customersEndpointPath);
        this.#ordersEndpoint = new BaseEndpoint(this, ordersEndpointPath);
        this.#replenishmentOrdersEndpoint = new BaseEndpoint(this, replenishmentOrdersEndpointPath);
    }

    getCustomersByUserId(userId) {
        return this.#customersEndpoint.getAll({ userId });
    }

    createCustomer(userId, resource) {
        return this.#customersEndpoint.create(resource, { userId });
    }

    updateCustomer(userId, id, resource) {
        return this.#customersEndpoint.update(id, resource, { userId });
    }

    getOrdersByUserId(userId) {
        return this.#ordersEndpoint.getAll({ userId });
    }

    createOrder(userId, resource) {
        return this.#ordersEndpoint.create(resource, { userId });
    }

    updateOrderStatus(userId, id, status) {
        return this.#ordersEndpoint.patch(id, { status }, { userId });
    }

    getReplenishmentOrdersByUserId(userId) {
        return this.#replenishmentOrdersEndpoint.getAll({ userId });
    }

    createReplenishmentOrder(userId, resource) {
        return this.#replenishmentOrdersEndpoint.create(resource, { userId });
    }

    updateReplenishmentOrderStatus(userId, id, status) {
        return this.#replenishmentOrdersEndpoint.patch(id, { status }, { userId });
    }
}
