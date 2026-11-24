import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;
const tokensEndpointPath = import.meta.env.VITE_TOKENS_ENDPOINT_PATH;


/**
 * Infrastructure gateway of the IAM bounded context: sign up creates a user and sign in creates a token
 * (POST /users and POST /tokens, as in ADR-008 of the course reference).
 */
export class IamApi extends BaseApi {
    #usersEndpoint;
    #tokensEndpoint;

    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
        this.#tokensEndpoint = new BaseEndpoint(this, tokensEndpointPath);
    }


    signUp(signUpResource) {
        return this.#usersEndpoint.create(signUpResource);
    }


    signIn(signInResource) {
        return this.#tokensEndpoint.create(signInResource);
    }
}
