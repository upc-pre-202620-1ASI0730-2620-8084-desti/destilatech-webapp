import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';
import { TenantEndpoint } from '@/shared/infrastructure/tenant-endpoint.js';

const customersEndpointPath = import.meta.env.VITE_CUSTOMERS_ENDPOINT_PATH;
const ordersEndpointPath = import.meta.env.VITE_ORDERS_ENDPOINT_PATH;
const replenishmentOrdersEndpointPath = import.meta.env.VITE_REPLENISHMENT_ORDERS_ENDPOINT_PATH;


/**
 * Orders & Replenishment endpoints of the platform API.
 * The lists belong to a tenant (`/tenants/{tenantId}/...`) and the writes send the `tenantId` in the body.
 * The platform updates the stock:
 * a new order discounts it, a cancelled order returns it and a received replenishment adds it.
 */
export class OrdersApi extends BaseApi {
    #customersEndpoint;
    #ordersEndpoint;
    #replenishmentOrdersEndpoint;
    #tenantCustomersEndpoint;
    #tenantOrdersEndpoint;
    #tenantReplenishmentOrdersEndpoint;

    constructor() {
        super();
        this.#customersEndpoint = new BaseEndpoint(this, customersEndpointPath);
        this.#ordersEndpoint = new BaseEndpoint(this, ordersEndpointPath);
        this.#replenishmentOrdersEndpoint = new BaseEndpoint(this, replenishmentOrdersEndpointPath);
        this.#tenantCustomersEndpoint = new TenantEndpoint(this, customersEndpointPath);
        this.#tenantOrdersEndpoint = new TenantEndpoint(this, ordersEndpointPath);
        this.#tenantReplenishmentOrdersEndpoint = new TenantEndpoint(this, replenishmentOrdersEndpointPath);
    }

    getCustomersByUserId(userId) {
        return this.#tenantCustomersEndpoint.getAll(userId);
    }

    createCustomer(userId, resource) {
        return this.#customersEndpoint.create({ ...resource, tenantId: userId });
    }

    updateCustomer(userId, id, resource) {
        return this.#customersEndpoint.update(id, { ...resource, tenantId: userId });
    }

    getOrdersByUserId(userId) {
        return this.#tenantOrdersEndpoint.getAll(userId);
    }

    createOrder(userId, resource) {
        return this.#ordersEndpoint.create({ tenantId: userId, ...resource });
    }

    updateOrderStatus(userId, id, status) {
        return this.#ordersEndpoint.patch(id, { tenantId: userId, status });
    }

    getReplenishmentOrdersByUserId(userId) {
        return this.#tenantReplenishmentOrdersEndpoint.getAll(userId);
    }

    createReplenishmentOrder(userId, resource) {
        return this.#replenishmentOrdersEndpoint.create({ tenantId: userId, ...resource });
    }

    updateReplenishmentOrderStatus(userId, id, status) {
        return this.#replenishmentOrdersEndpoint.patch(id, { tenantId: userId, status });
    }
}
