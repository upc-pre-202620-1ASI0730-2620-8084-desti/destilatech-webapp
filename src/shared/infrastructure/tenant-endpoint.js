const tenantsEndpointPath = import.meta.env.VITE_TENANTS_ENDPOINT_PATH;


/**
 * Collection that belongs to a tenant (the producer or retailer account): `/tenants/{tenantId}/{resource}`.
 * The platform API lists and reads the data of a tenant as sub-resources of it, instead of filtering with
 * query parameters such as `?userId=`.
 */
export class TenantEndpoint {
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }

    pathFor(tenantId) {
        return `${tenantsEndpointPath}/${tenantId}${this.endpointPath}`;
    }

    getAll(tenantId, params = {}) {
        return this.http.get(this.pathFor(tenantId), { params });
    }

    getById(tenantId, id) {
        return this.http.get(`${this.pathFor(tenantId)}/${id}`);
    }
}
