const subscriptionPlans = () => import('./views/subscription-plans.vue');


const billingRoutes = [
    {
        path: 'billing/plans',
        name: 'subscription-plans',
        component: subscriptionPlans,
        meta: { title: 'billing.title', allowWithoutAccess: true }
    }
];

export default billingRoutes;
