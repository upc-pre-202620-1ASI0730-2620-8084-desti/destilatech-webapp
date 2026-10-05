import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const customersEndpointPath = import.meta.env.VITE_CUSTOMERS_ENDPOINT_PATH;
const ordersEndpointPath = import.meta.env.VITE_ORDERS_ENDPOINT_PATH;
const replenishmentOrdersEndpointPath = import.meta.env.VITE_REPLENISHMENT_ORDERS_ENDPOINT_PATH;

/**
 * Infrastructure adapter for the Orders & Replenishment bounded context.
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
        return this.#customersEndpoint.getAll({ userId, _sort: 'name', _order: 'asc' });
    }

    createCustomer(resource) {
        return this.#customersEndpoint.create(resource);
    }

    updateCustomer(id, resource) {
        return this.#customersEndpoint.update(id, resource);
    }

    getOrdersByUserId(userId) {
        return this.#ordersEndpoint.getAll({ userId, _sort: 'orderDate', _order: 'desc' });
    }

    createOrder(resource) {
        return this.#ordersEndpoint.create(resource);
    }

    patchOrder(id, changes) {
        return this.#ordersEndpoint.patch(id, changes);
    }

    getReplenishmentOrdersByUserId(userId) {
        return this.#replenishmentOrdersEndpoint.getAll({ userId, _sort: 'orderDate', _order: 'desc' });
    }

    createReplenishmentOrder(resource) {
        return this.#replenishmentOrdersEndpoint.create(resource);
    }

    patchReplenishmentOrder(id, changes) {
        return this.#replenishmentOrdersEndpoint.patch(id, changes);
    }
}
