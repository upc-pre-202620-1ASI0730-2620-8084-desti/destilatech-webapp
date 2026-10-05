const alertsInbox = () => import('./views/alerts-inbox.vue');

const alertsNotificationsRoutes = [
    { path: 'alerts', name: 'alerts-inbox', component: alertsInbox, meta: { title: 'alerts.title' } }
];

export default alertsNotificationsRoutes;
