const ordersList = () => import('./views/orders-list.vue');
const customersList = () => import('./views/customers-list.vue');
const replenishmentOrders = () => import('./views/replenishment-orders.vue');


const ordersReplenishmentRoutes = [
    { path: 'orders', name: 'orders', component: ordersList, meta: { title: 'orders.title' } },
    { path: 'orders/customers', name: 'customers', component: customersList, meta: { title: 'orders.customers.title' } },
    {
        path: 'orders/replenishment',
        name: 'replenishment-orders',
        component: replenishmentOrders,
        meta: { title: 'orders.replenishment.title' }
    }
];

export default ordersReplenishmentRoutes;
