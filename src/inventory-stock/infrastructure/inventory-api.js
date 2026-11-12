import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';
import { TenantEndpoint } from '@/shared/infrastructure/tenant-endpoint.js';

const productsEndpointPath = import.meta.env.VITE_PRODUCTS_ENDPOINT_PATH;
const stockItemsEndpointPath = import.meta.env.VITE_STOCK_ITEMS_ENDPOINT_PATH;
const stockMovementsEndpointPath = import.meta.env.VITE_STOCK_MOVEMENTS_ENDPOINT_PATH;


/**
 * Inventory & Stock Management endpoints of the platform API.
 * The lists belong to a tenant (`/tenants/{tenantId}/...`) and the writes send the `tenantId` in the body.
 */
export class InventoryApi extends BaseApi {
    #productsEndpoint;
    #stockItemsEndpoint;
    #stockMovementsEndpoint;
    #tenantProductsEndpoint;
    #tenantStockItemsEndpoint;
    #tenantStockMovementsEndpoint;

    constructor() {
        super();
        this.#productsEndpoint = new BaseEndpoint(this, productsEndpointPath);
        this.#stockItemsEndpoint = new BaseEndpoint(this, stockItemsEndpointPath);
        this.#stockMovementsEndpoint = new BaseEndpoint(this, stockMovementsEndpointPath);
        this.#tenantProductsEndpoint = new TenantEndpoint(this, productsEndpointPath);
        this.#tenantStockItemsEndpoint = new TenantEndpoint(this, stockItemsEndpointPath);
        this.#tenantStockMovementsEndpoint = new TenantEndpoint(this, stockMovementsEndpointPath);
    }

    getProductsByUserId(userId) {
        return this.#tenantProductsEndpoint.getAll(userId);
    }

    /** Creates the product and, on the server, its stock item with the given low stock threshold. */
    createProduct(userId, resource) {
        return this.#productsEndpoint.create({ tenantId: userId, ...resource });
    }

    updateProduct(userId, id, resource) {
        return this.#productsEndpoint.update(id, { tenantId: userId, ...resource });
    }

    getStockItemsByUserId(userId) {
        return this.#tenantStockItemsEndpoint.getAll(userId);
    }

    configureLowStockThreshold(userId, id, lowStockThreshold) {
        return this.#stockItemsEndpoint.patch(id, { tenantId: userId, lowStockThreshold });
    }

    getStockMovementsByUserId(userId) {
        return this.#tenantStockMovementsEndpoint.getAll(userId);
    }

    /** Registers the movement; the server updates the stock item and raises the low stock alert. */
    createStockMovement(userId, resource) {
        return this.#stockMovementsEndpoint.create({ tenantId: userId, ...resource });
    }
}
