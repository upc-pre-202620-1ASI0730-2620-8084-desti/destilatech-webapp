import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const alertsEndpointPath = import.meta.env.VITE_ALERTS_ENDPOINT_PATH;


export class AlertsApi extends BaseApi {
    #alertsEndpoint;

    constructor() {
        super();
        this.#alertsEndpoint = new BaseEndpoint(this, alertsEndpointPath);
    }

    getAlertsByUserId(userId) {
        return this.#alertsEndpoint.getAll({ userId, _sort: 'createdAt', _order: 'desc' });
    }


    createAlert(resource) {
        return this.#alertsEndpoint.create(resource);
    }


    patchAlert(id, changes) {
        return this.#alertsEndpoint.patch(id, changes);
    }
}
