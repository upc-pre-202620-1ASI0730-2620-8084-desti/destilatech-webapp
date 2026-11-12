const subscriptionPlans = () => import('./views/subscription-plans.vue');
const checkoutSuccess = () => import('./views/checkout-success.vue');
const checkoutCancelled = () => import('./views/checkout-cancelled.vue');


/**
 * The checkout routes are the return addresses configured in the platform for Stripe Checkout
 * (`Stripe:SuccessUrl` and `Stripe:CancelUrl`), so their paths must not change.
 */
const billingRoutes = [
    {
        path: 'billing/plans',
        name: 'subscription-plans',
        component: subscriptionPlans,
        meta: { title: 'billing.title', allowWithoutAccess: true }
    },
    {
        path: 'billing/checkout/success',
        name: 'checkout-success',
        component: checkoutSuccess,
        meta: { title: 'billing.checkout.title', allowWithoutAccess: true }
    },
    {
        path: 'billing/checkout/cancelled',
        name: 'checkout-cancelled',
        component: checkoutCancelled,
        meta: { title: 'billing.checkout.title', allowWithoutAccess: true }
    }
];

export default billingRoutes;
