const inventoryOverview = () => import('./views/inventory-overview.vue');
const productDetail = () => import('./views/product-detail.vue');


const inventoryStockRoutes = [
    { path: 'inventory', name: 'inventory', component: inventoryOverview, meta: { title: 'inventory.title' } },
    {
        path: 'inventory/products/:productId',
        name: 'product-detail',
        component: productDetail,
        props: true,
        meta: { title: 'inventory.detail-title' }
    }
];

export default inventoryStockRoutes;
