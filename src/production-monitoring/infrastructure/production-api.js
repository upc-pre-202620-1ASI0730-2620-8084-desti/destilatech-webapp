import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';
import { TenantEndpoint } from '@/shared/infrastructure/tenant-endpoint.js';

const batchesEndpointPath = import.meta.env.VITE_BATCHES_ENDPOINT_PATH;
const processVariablesEndpointPath = import.meta.env.VITE_PROCESS_VARIABLES_ENDPOINT_PATH;
const sensorReadingsEndpointPath = import.meta.env.VITE_SENSOR_READINGS_ENDPOINT_PATH;


/**
 * Production & Monitoring endpoints of the platform API.
 * The lists belong to a tenant (`/tenants/{tenantId}/...`) and the writes send the `tenantId` in the body.
 */
export class ProductionApi extends BaseApi {
    #batchesEndpoint;
    #processVariablesEndpoint;
    #sensorReadingsEndpoint;
    #tenantBatchesEndpoint;
    #tenantProcessVariablesEndpoint;
    #tenantSensorReadingsEndpoint;

    constructor() {
        super();
        this.#batchesEndpoint = new BaseEndpoint(this, batchesEndpointPath);
        this.#processVariablesEndpoint = new BaseEndpoint(this, processVariablesEndpointPath);
        this.#sensorReadingsEndpoint = new BaseEndpoint(this, sensorReadingsEndpointPath);
        this.#tenantBatchesEndpoint = new TenantEndpoint(this, batchesEndpointPath);
        this.#tenantProcessVariablesEndpoint = new TenantEndpoint(this, processVariablesEndpointPath);
        this.#tenantSensorReadingsEndpoint = new TenantEndpoint(this, sensorReadingsEndpointPath);
    }

    getBatchesByUserId(userId) {
        return this.#tenantBatchesEndpoint.getAll(userId);
    }

    createBatch(userId, resource) {
        return this.#batchesEndpoint.create({ tenantId: userId, ...resource });
    }

    /**
     * Moves the batch to its next stage. When the stage is BOTTLED, the server also adds the bottled units
     * to the stock of the product.
     */
    advanceBatchStage(userId, id, resource) {
        return this.http.patch(`${batchesEndpointPath}/${id}/status`, { tenantId: userId, ...resource });
    }

    getProcessVariablesByUserId(userId) {
        return this.#tenantProcessVariablesEndpoint.getAll(userId);
    }

    createProcessVariable(userId, resource) {
        return this.#processVariablesEndpoint.create({ tenantId: userId, ...resource });
    }

    configureVariableRange(userId, id, minRange, maxRange) {
        return this.#processVariablesEndpoint.patch(id, { tenantId: userId, minRange, maxRange });
    }

    /** Latest readings first. */
    getSensorReadingsByUserId(userId, limit = 500) {
        return this.#tenantSensorReadingsEndpoint.getAll(userId, { limit });
    }

    /** Records the reading; the server checks the range and raises the anomaly alert. */
    createSensorReading(userId, resource) {
        return this.#sensorReadingsEndpoint.create({ tenantId: userId, ...resource });
    }
}
