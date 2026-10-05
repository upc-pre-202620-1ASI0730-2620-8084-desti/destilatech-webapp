import { createRouter, createWebHistory } from 'vue-router';
import i18n from './i18n.js';
import Layout from './shared/presentation/components/layout.vue';
import iamRoutes from './iam/presentation/iam-routes.js';
import billingRoutes from './billing/presentation/billing-routes.js';
import productionMonitoringRoutes from './production-monitoring/presentation/production-monitoring-routes.js';
import inventoryStockRoutes from './inventory-stock/presentation/inventory-stock-routes.js';
import ordersReplenishmentRoutes from './orders-replenishment/presentation/orders-replenishment-routes.js';
import alertsNotificationsRoutes from './alerts-notifications/presentation/alerts-notifications-routes.js';
import analyticsEstimationsRoutes from './analytics-estimations/presentation/analytics-estimations-routes.js';
import { authenticationGuard } from './iam/infrastructure/authentication.guard.js';
import { useIamStore } from './iam/application/iam.store.js';

const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');


const routes = [
    ...iamRoutes.publicRoutes,
    {
        path: '/',
        component: Layout,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/dashboard' },
            ...analyticsEstimationsRoutes,
            ...productionMonitoringRoutes,
            ...inventoryStockRoutes,
            ...ordersReplenishmentRoutes,
            ...alertsNotificationsRoutes,
            ...billingRoutes,
            ...iamRoutes.privateRoutes
        ]
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'page-not-found.title' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: () => ({ top: 0 })
});

router.beforeEach(async (to, from) => {

    if (to.matched.some(record => record.meta['requiresAuth'])) await useIamStore().loadDemoAccount();
    return true;
});

router.afterEach(to => {
    const baseTitle = 'Destilatech';
    const titleKey = to.meta['title'];
    document.title = titleKey ? `${baseTitle} - ${i18n.global.t(titleKey)}` : baseTitle;
});

export default router;
