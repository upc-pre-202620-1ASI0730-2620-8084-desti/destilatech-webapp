import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';
import { TRIAL_DURATION_DAYS } from '@/iam/domain/model/trial-period.entity.js';

const signInEndpointPath = import.meta.env.VITE_SIGNIN_ENDPOINT_PATH;
const signUpEndpointPath = import.meta.env.VITE_SIGNUP_ENDPOINT_PATH;
const usersEndpointPath = import.meta.env.VITE_USERS_ENDPOINT_PATH;


export class IamApi extends BaseApi {
    #signInEndpoint;
    #signUpEndpoint;
    #usersEndpoint;

    constructor() {
        super();
        this.#signInEndpoint = new BaseEndpoint(this, signInEndpointPath);
        this.#signUpEndpoint = new BaseEndpoint(this, signUpEndpointPath);
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }


    async signIn(signInCommand) {

        const response = await this.#usersEndpoint.getAll({ email: signInCommand.email, password: signInCommand.password });
        const user = response.data[0];
        if (!user) return { status: 401, statusText: 'Unauthorized' };
        return { status: 200, data: { id: user.id, username: user.email, token: `fake-token-${user.id}` } };
    }

    async signUp(signUpCommand) {

        const existing = await this.#usersEndpoint.getAll({ email: signUpCommand.email });
        if (existing.data.length > 0) throw new Error('email-already-in-use');
        const now = new Date();
        const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
        await this.#usersEndpoint.create({
            ...signUpCommand,
            createdAt: now.toISOString(),
            trialPeriod: { startDate: now.toISOString(), endDate: trialEnd.toISOString() },
            accessGrantedUntil: null
        });
        return { status: 200, data: { message: 'User created successfully' } };
    }

    getUserById(id) {
        return this.#usersEndpoint.getById(id);
    }


    patchUser(id, changes) {
        return this.#usersEndpoint.patch(id, changes);
    }
}
