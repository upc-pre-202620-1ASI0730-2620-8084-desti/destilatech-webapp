import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH;
const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;
const paymentsEndpointPath = import.meta.env.VITE_PAYMENTS_ENDPOINT_PATH;
const checkoutSessionsEndpointPath = import.meta.env.VITE_CHECKOUT_SESSIONS_ENDPOINT_PATH;


export class BillingApi extends BaseApi {
    #plansEndpoint;
    #subscriptionsEndpoint;
    #paymentsEndpoint;
    #checkoutSessionsEndpoint;

    constructor() {
        super();
        this.#plansEndpoint = new BaseEndpoint(this, plansEndpointPath);
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsEndpointPath);
        this.#paymentsEndpoint = new BaseEndpoint(this, paymentsEndpointPath);
        this.#checkoutSessionsEndpoint = new BaseEndpoint(this, checkoutSessionsEndpointPath);
    }

    getPlans() {
        return this.#plansEndpoint.getAll();
    }


    getSubscriptionsByUserId(userId) {
        return this.#subscriptionsEndpoint.getAll({ userId, _sort: 'startDate', _order: 'desc' });
    }


    patchSubscription(id, changes) {
        return this.#subscriptionsEndpoint.patch(id, changes);
    }


    getPaymentsByUserId(userId) {
        return this.#paymentsEndpoint.getAll({ userId, _sort: 'paidAt', _order: 'desc' });
    }


    getPaymentsByReference(reference) {
        return this.#paymentsEndpoint.getAll({ reference });
    }


    createPayment(resource) {
        return this.#paymentsEndpoint.create(resource);
    }


    createSubscription(resource) {
        return this.#subscriptionsEndpoint.create(resource);
    }


    createCheckoutSession(resource) {
        return this.#checkoutSessionsEndpoint.create(resource);
    }


    getCheckoutSession(sessionId) {
        return this.#checkoutSessionsEndpoint.getById(sessionId);
    }
}
