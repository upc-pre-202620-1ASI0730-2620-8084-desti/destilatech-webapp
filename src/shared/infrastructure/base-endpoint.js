export class BaseEndpoint {
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }

    getAll(params = {}) {
        return this.http.get(this.endpointPath, { params });
    }

    getById(id, params = {}) {
        return this.http.get(`${this.endpointPath}/${id}`, { params });
    }

    create(resource, params = {}) {
        return this.http.post(this.endpointPath, resource, { params });
    }

    update(id, resource, params = {}) {
        return this.http.put(`${this.endpointPath}/${id}`, resource, { params });
    }

    patch(id, changes, params = {}) {
        return this.http.patch(`${this.endpointPath}/${id}`, changes, { params });
    }

    delete(id, params = {}) {
        return this.http.delete(`${this.endpointPath}/${id}`, { params });
    }
}
