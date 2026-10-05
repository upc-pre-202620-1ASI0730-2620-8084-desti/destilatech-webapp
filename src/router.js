import { createRouter, createWebHistory } from 'vue-router';
import i18n from './i18n.js';
import Layout from './shared/presentation/components/layout.vue';
import billingRoutes from './billing/presentation/billing-routes.js';
import productionMonitoringRoutes from './production-monitoring/presentation/production-monitoring-routes.js';
import inventoryStockRoutes from './inventory-stock/presentation/inventory-stock-routes.js';
import ordersReplenishmentRoutes from './orders-replenishment/presentation/orders-replenishment-routes.js';
import alertsNotificationsRoutes from './alerts-notifications/presentation/alerts-notifications-routes.js';
import analyticsEstimationsRoutes from './analytics-estimations/presentation/analytics-estimations-routes.js';
import { useUserStore } from './shared/application/user.store.js';

const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');


const routes = [
    {
        path: '/',
        component: Layout,
        children: [
            { path: '', redirect: '/dashboard' },
            ...analyticsEstimationsRoutes,
            ...productionMonitoringRoutes,
            ...inventoryStockRoutes,
            ...ordersReplenishmentRoutes,
            ...alertsNotificationsRoutes,
            ...billingRoutes
        ]
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'page-not-found.title' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: () => ({ top: 0 })
});

router.beforeEach(async to => {
    const userStore = useUserStore();
    await userStore.fetchUsers();
    const allowedBusinessTypes = to.meta['businessTypes'];
    if (allowedBusinessTypes && !allowedBusinessTypes.includes(userStore.currentUser?.businessType)) {
        return { path: '/dashboard' };
    }
    return true;
});

router.afterEach(to => {
    const baseTitle = 'Destilatech';
    const titleKey = to.meta['title'];
    document.title = titleKey ? `${baseTitle} - ${i18n.global.t(titleKey)}` : baseTitle;
});

export default router;
