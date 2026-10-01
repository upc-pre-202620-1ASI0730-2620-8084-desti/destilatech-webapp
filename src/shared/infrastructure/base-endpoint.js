export class BaseEndpoint {
    constructor(baseApi, endpointPath) {
        this.http = baseApi.http;
        this.endpointPath = endpointPath;
    }


    getAll(params = {}) {
        return this.http.get(this.endpointPath, { params });
    }


    getById(id) {
        return this.http.get(`${this.endpointPath}/${id}`);
    }
}