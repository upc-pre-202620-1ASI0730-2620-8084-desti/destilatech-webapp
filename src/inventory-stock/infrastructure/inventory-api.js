import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const productsEndpointPath = import.meta.env.VITE_PRODUCTS_ENDPOINT_PATH;
const stockItemsEndpointPath = import.meta.env.VITE_STOCK_ITEMS_ENDPOINT_PATH;
const stockMovementsEndpointPath = import.meta.env.VITE_STOCK_MOVEMENTS_ENDPOINT_PATH;


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

    createProduct(resource) {
        return this.#productsEndpoint.create(resource);
    }

    updateProduct(id, resource) {
        return this.#productsEndpoint.update(id, resource);
    }

    getStockItemsByUserId(userId) {
        return this.#stockItemsEndpoint.getAll({ userId });
    }

    createStockItem(resource) {
        return this.#stockItemsEndpoint.create(resource);
    }

    patchStockItem(id, changes) {
        return this.#stockItemsEndpoint.patch(id, changes);
    }

    getStockMovementsByUserId(userId) {
        return this.#stockMovementsEndpoint.getAll({ userId, _sort: 'movementDate', _order: 'desc' });
    }

    createStockMovement(resource) {
        return this.#stockMovementsEndpoint.create(resource);
    }
}
