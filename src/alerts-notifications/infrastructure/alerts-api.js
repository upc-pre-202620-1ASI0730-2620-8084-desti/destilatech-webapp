import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const alertsEndpointPath = import.meta.env.VITE_ALERTS_ENDPOINT_PATH;


/**
 * Alerts & Notifications endpoints of the platform API.
 * The platform raises the alerts itself (low stock and out of range readings), so the web app only reads them
 * and marks them as attended.
 */
export class AlertsApi extends BaseApi {
    #alertsEndpoint;

    constructor() {
        super();
        this.#alertsEndpoint = new BaseEndpoint(this, alertsEndpointPath);
    }

    getAlertsByAccountId(accountId) {
        return this.#alertsEndpoint.getAll({ accountId });
    }

    markAlertAsAttended(id) {
        return this.http.patch(`${alertsEndpointPath}/${id}/attended`);
    }
}
