import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;


export class UsersApi extends BaseApi {
    #usersEndpoint;

    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }


    getUsers() {
        return this.#usersEndpoint.getAll();
    }


    patchUser(id, changes) {
        return this.#usersEndpoint.patch(id, changes);
    }
}
