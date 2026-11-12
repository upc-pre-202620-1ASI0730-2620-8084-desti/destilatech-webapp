import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const productsEndpointPath = import.meta.env.VITE_PRODUCTS_ENDPOINT_PATH;
const stockItemsEndpointPath = import.meta.env.VITE_STOCK_ITEMS_ENDPOINT_PATH;
const stockMovementsEndpointPath = import.meta.env.VITE_STOCK_MOVEMENTS_ENDPOINT_PATH;


/**
 * Inventory & Stock Management endpoints of the platform API.
 * Every request is scoped to the account with the `userId` query parameter.
 */
export class InventoryApi extends BaseApi {
    #productsEndpoint;
    #stockItemsEndpoint;
    #stockMovementsEndpoint;

    constructor() {
        super();
        this.#productsEndpoint = new BaseEndpoint(this, productsEndpointPath);
        this.#stockItemsEndpoint = new BaseEndpoint(this, stockItemsEndpointPath);
        this.#stockMovementsEndpoint = new BaseEndpoint(this, stockMovementsEndpointPath);
    }

    getProductsByUserId(userId) {
        return this.#productsEndpoint.getAll({ userId });
    }

    /** Creates the product and, on the server, its stock item with the given low stock threshold. */
    createProduct(userId, resource) {
        return this.#productsEndpoint.create(resource, { userId });
    }

    updateProduct(userId, id, resource) {
        return this.#productsEndpoint.update(id, resource, { userId });
    }

    getStockItemsByUserId(userId) {
        return this.#stockItemsEndpoint.getAll({ userId });
    }

    configureLowStockThreshold(userId, id, lowStockThreshold) {
        return this.#stockItemsEndpoint.patch(id, { lowStockThreshold }, { userId });
    }

    getStockMovementsByUserId(userId) {
        return this.#stockMovementsEndpoint.getAll({ userId });
    }

    /** Registers the movement; the server updates the stock item and raises the low stock alert. */
    createStockMovement(userId, resource) {
        return this.#stockMovementsEndpoint.create(resource, { userId });
    }
}
