import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const batchesEndpointPath = import.meta.env.VITE_BATCHES_ENDPOINT_PATH;
const processVariablesEndpointPath = import.meta.env.VITE_PROCESS_VARIABLES_ENDPOINT_PATH;
const sensorReadingsEndpointPath = import.meta.env.VITE_SENSOR_READINGS_ENDPOINT_PATH;


/**
 * Production & Monitoring endpoints of the platform API.
 * Every request is scoped to the account with the `userId` query parameter.
 */
export class ProductionApi extends BaseApi {
    #batchesEndpoint;
    #processVariablesEndpoint;
    #sensorReadingsEndpoint;

    constructor() {
        super();
        this.#batchesEndpoint = new BaseEndpoint(this, batchesEndpointPath);
        this.#processVariablesEndpoint = new BaseEndpoint(this, processVariablesEndpointPath);
        this.#sensorReadingsEndpoint = new BaseEndpoint(this, sensorReadingsEndpointPath);
    }

    getBatchesByUserId(userId) {
        return this.#batchesEndpoint.getAll({ userId });
    }

    createBatch(userId, resource) {
        return this.#batchesEndpoint.create(resource, { userId });
    }

    /**
     * Moves the batch to its next stage. When the stage is BOTTLED, the server also adds the bottled units
     * to the stock of the product.
     */
    advanceBatchStage(userId, id, resource) {
        return this.http.patch(`${batchesEndpointPath}/${id}/status`, resource, { params: { userId } });
    }

    getProcessVariablesByUserId(userId) {
        return this.#processVariablesEndpoint.getAll({ userId });
    }

    createProcessVariable(userId, resource) {
        return this.#processVariablesEndpoint.create(resource, { userId });
    }

    configureVariableRange(userId, id, minRange, maxRange) {
        return this.#processVariablesEndpoint.patch(id, { minRange, maxRange }, { userId });
    }

    /** Latest readings first. */
    getSensorReadingsByUserId(userId, limit = 500) {
        return this.#sensorReadingsEndpoint.getAll({ userId, _limit: limit });
    }

    /** Records the reading; the server checks the range and raises the anomaly alert. */
    createSensorReading(userId, resource) {
        return this.#sensorReadingsEndpoint.create(resource, { userId });
    }
}
