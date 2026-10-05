const subscriptionPlans = () => import('./views/subscription-plans.vue');
const checkoutSuccess = () => import('./views/checkout-success.vue');
const checkoutCancelled = () => import('./views/checkout-cancelled.vue');


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
        meta: { title: 'billing.title', allowWithoutAccess: true }
    },
    {
        path: 'billing/checkout/cancelled',
        name: 'checkout-cancelled',
        component: checkoutCancelled,
        meta: { title: 'billing.checkout.cancelled-title', allowWithoutAccess: true }
    }
];

export default billingRoutes;
