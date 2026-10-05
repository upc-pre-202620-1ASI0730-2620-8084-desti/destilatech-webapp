const dashboard = () => import('./views/dashboard.vue');
const historicalIndicators = () => import('./views/historical-indicators.vue');


const analyticsEstimationsRoutes = [
    { path: 'dashboard', name: 'dashboard', component: dashboard, meta: { title: 'navigation.dashboard' } },
    {
        path: 'analytics/indicators',
        name: 'historical-indicators',
        component: historicalIndicators,
        meta: { title: 'analytics.indicators.title' }
    }
];

export default analyticsEstimationsRoutes;
