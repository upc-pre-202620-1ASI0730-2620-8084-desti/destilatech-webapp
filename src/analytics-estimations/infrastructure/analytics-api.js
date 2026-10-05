import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const stockMovementsEndpointPath = import.meta.env.VITE_STOCK_MOVEMENTS_ENDPOINT_PATH;
const stockItemsEndpointPath = import.meta.env.VITE_STOCK_ITEMS_ENDPOINT_PATH;
const ordersEndpointPath = import.meta.env.VITE_ORDERS_ENDPOINT_PATH;
const batchesEndpointPath = import.meta.env.VITE_BATCHES_ENDPOINT_PATH;


export class AnalyticsApi extends BaseApi {
    #stockMovementsEndpoint;
    #stockItemsEndpoint;
    #ordersEndpoint;
    #batchesEndpoint;

    constructor() {
        super();
        this.#stockMovementsEndpoint = new BaseEndpoint(this, stockMovementsEndpointPath);
        this.#stockItemsEndpoint = new BaseEndpoint(this, stockItemsEndpointPath);
        this.#ordersEndpoint = new BaseEndpoint(this, ordersEndpointPath);
        this.#batchesEndpoint = new BaseEndpoint(this, batchesEndpointPath);
    }

    getStockMovementHistory(userId) {
        return this.#stockMovementsEndpoint.getAll({ userId });
    }

    getStockLevels(userId) {
        return this.#stockItemsEndpoint.getAll({ userId });
    }

    getOrderHistory(userId) {
        return this.#ordersEndpoint.getAll({ userId });
    }

    getBatchHistory(userId) {
        return this.#batchesEndpoint.getAll({ userId });
    }
}
