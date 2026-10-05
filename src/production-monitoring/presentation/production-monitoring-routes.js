import { BusinessType } from '@/iam/domain/model/business-type.js';

const monitoringDashboard = () => import('./views/monitoring-dashboard.vue');
const batchManagement = () => import('./views/batch-management.vue');
const batchDetail = () => import('./views/batch-detail.vue');

const producerOnly = [BusinessType.PRODUCER];


const productionMonitoringRoutes = [
    {
        path: 'production/monitoring',
        name: 'production-monitoring',
        component: monitoringDashboard,
        meta: { title: 'production.monitoring.title', businessTypes: producerOnly }
    },
    {
        path: 'production/batches',
        name: 'batch-management',
        component: batchManagement,
        meta: { title: 'production.batches.title', businessTypes: producerOnly }
    },
    {
        path: 'production/batches/:batchId',
        name: 'batch-detail',
        component: batchDetail,
        props: true,
        meta: { title: 'production.detail.page-title', businessTypes: producerOnly }
    }
];

export default productionMonitoringRoutes;
