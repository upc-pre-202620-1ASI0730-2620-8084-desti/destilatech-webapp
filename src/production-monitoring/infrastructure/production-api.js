import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const batchesEndpointPath = import.meta.env.VITE_BATCHES_ENDPOINT_PATH;
const processVariablesEndpointPath = import.meta.env.VITE_PROCESS_VARIABLES_ENDPOINT_PATH;
const sensorReadingsEndpointPath = import.meta.env.VITE_SENSOR_READINGS_ENDPOINT_PATH;


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
        return this.#batchesEndpoint.getAll({ userId, _sort: 'startDate', _order: 'desc' });
    }

    createBatch(resource) {
        return this.#batchesEndpoint.create(resource);
    }

    updateBatch(id, resource) {
        return this.#batchesEndpoint.update(id, resource);
    }

    getProcessVariablesByUserId(userId) {
        return this.#processVariablesEndpoint.getAll({ userId });
    }

    createProcessVariable(resource) {
        return this.#processVariablesEndpoint.create(resource);
    }

    patchProcessVariable(id, changes) {
        return this.#processVariablesEndpoint.patch(id, changes);
    }


    getSensorReadingsByUserId(userId, limit = 500) {
        return this.#sensorReadingsEndpoint.getAll({ userId, _sort: 'recordedAt', _order: 'desc', _limit: limit });
    }


    createSensorReading(resource) {
        return this.#sensorReadingsEndpoint.create(resource);
    }
}
