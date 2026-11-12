import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';
import { TenantEndpoint } from '@/shared/infrastructure/tenant-endpoint.js';

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH;
const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH;
const paymentsEndpointPath = import.meta.env.VITE_PAYMENTS_ENDPOINT_PATH;
const checkoutSessionsEndpointPath = import.meta.env.VITE_CHECKOUT_SESSIONS_ENDPOINT_PATH;


/**
 * Subscriptions & Billing endpoints of the platform API.
 * Payments go through Stripe Checkout (test mode): the platform creates the checkout session, the user pays on the
 * Stripe page and, on the way back, the platform confirms the session and activates the subscription.
 */
export class BillingApi extends BaseApi {
    #plansEndpoint;
    #subscriptionsEndpoint;
    #tenantSubscriptionsEndpoint;
    #tenantPaymentsEndpoint;
    #checkoutSessionsEndpoint;

    constructor() {
        super();
        this.#plansEndpoint = new BaseEndpoint(this, plansEndpointPath);
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsEndpointPath);
        this.#tenantSubscriptionsEndpoint = new TenantEndpoint(this, subscriptionsEndpointPath);
        this.#tenantPaymentsEndpoint = new TenantEndpoint(this, paymentsEndpointPath);
        this.#checkoutSessionsEndpoint = new BaseEndpoint(this, checkoutSessionsEndpointPath);
    }

    getPlans() {
        return this.#plansEndpoint.getAll();
    }

    getSubscriptionsByUserId(userId) {
        return this.#tenantSubscriptionsEndpoint.getAll(userId);
    }

    cancelSubscription(id) {
        return this.#subscriptionsEndpoint.patch(id, { status: 'CANCELLED' });
    }

    getPaymentsByUserId(userId) {
        return this.#tenantPaymentsEndpoint.getAll(userId);
    }

    /** Returns `{ sessionId, url }`; `url` is the Stripe page where the user pays. */
    createCheckoutSession(userId, planId) {
        return this.#checkoutSessionsEndpoint.create({ tenantId: userId, planId });
    }

    /** Returns `{ payment, subscription }` once Stripe reports the session as paid. */
    confirmCheckoutSession(sessionId) {
        return this.http.post(`${checkoutSessionsEndpointPath}/${encodeURIComponent(sessionId)}/confirmation`);
    }
}
