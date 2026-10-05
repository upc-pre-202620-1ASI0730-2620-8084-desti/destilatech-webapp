<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useOrdersStore } from '@/orders-replenishment/application/orders.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import { useAnalyticsStore } from '@/analytics-estimations/application/analytics.store.js';
import { OrderStatus } from '@/orders-replenishment/domain/model/order.entity.js';
import { Money } from '@/shared/domain/model/money.js';
import { formatPeriodLabel } from '@/analytics-estimations/presentation/period-label.js';
import KpiCard from '@/shared/presentation/components/kpi-card.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import TrendChart from './trend-chart.vue';
import PriorityReplenishment from './priority-replenishment.vue';
import OrderStatusTag from '@/orders-replenishment/presentation/components/order-status-tag.vue';


const INVENTORY_CHART_DAYS = 56;

const { t, locale } = useI18n();
const inventoryStore = useInventoryStore();
const ordersStore = useOrdersStore();
const alertsStore = useAlertsStore();
const analyticsStore = useAnalyticsStore();

const loading = computed(() => inventoryStore.loading || ordersStore.loading);
const isEmpty = computed(() => !loading.value && !inventoryStore.products.length);
const monthSales = computed(() => new Money(ordersStore.currentMonthSales).format(locale.value));
const pendingOrders = computed(() => ordersStore.orders.filter(order => order.status === OrderStatus.PENDING).length);
const suppliersCount = computed(() => new Set(ordersStore.replenishmentOrders.map(order => order.supplierName)).size);

const movementChart = computed(() => {
  const indicators = analyticsStore.indicatorsFor(INVENTORY_CHART_DAYS);
  return {
    labels: indicators.entries.map(point => formatPeriodLabel(point.periodStart, indicators.granularity, locale.value)),
    entries: indicators.entries.map(point => point.value),
    exits: indicators.exits.map(point => point.value)
  };
});

const formatUnits = value => Math.round(value).toLocaleString(locale.value);
</script>

<template>
  <div class="flex flex-column gap-4">
    <div class="kpi-grid">
      <kpi-card :label="t('dashboard.retailer.month-sales')" :value="monthSales" icon="pi pi-wallet"
                :caption="t('dashboard.retailer.month-sales-caption')" tone="success" :loading="ordersStore.loading"/>
      <kpi-card :label="t('dashboard.retailer.orders')" :value="ordersStore.openOrders.length" icon="pi pi-shopping-cart"
                :caption="t('dashboard.retailer.pending', { count: pendingOrders })" tone="success" :loading="ordersStore.loading"/>
      <kpi-card :label="t('dashboard.retailer.low-stock')" :value="inventoryStore.lowStockItems.length" icon="pi pi-exclamation-triangle"
                :caption="inventoryStore.lowStockItems.length ? t('dashboard.retailer.replenish-today') : t('dashboard.producer.all-clear')"
                :tone="inventoryStore.lowStockItems.length ? 'warn' : 'success'" :loading="inventoryStore.loading"/>
      <kpi-card :label="t('dashboard.retailer.products')" :value="inventoryStore.products.length" icon="pi pi-tags"
                :caption="t('dashboard.retailer.suppliers', { count: suppliersCount })" :loading="inventoryStore.loading"/>
    </div>

    <div v-if="isEmpty" class="surface-panel">
      <empty-state icon="pi pi-box" :title="t('dashboard.retailer.empty-title')" :description="t('dashboard.retailer.empty-description')">
        <router-link :to="{ name: 'inventory' }"><pv-button icon="pi pi-plus" :label="t('inventory.new-product')"/></router-link>
      </empty-state>
    </div>

    <template v-else>
      <div class="content-grid">
        <div class="surface-panel">
          <div class="surface-panel__header">
            <h2>{{ t('dashboard.retailer.inventory-movement') }}</h2>
            <router-link :to="{ name: 'historical-indicators' }" class="text-sm dashboard-link">{{ t('navigation.indicators') }}</router-link>
          </div>
          <trend-chart :labels="movementChart.labels" :value-formatter="formatUnits" :series="[
            { label: t('analytics.indicators.entries'), data: movementChart.entries, color: '#2f7a4f' },
            { label: t('analytics.indicators.exits'), data: movementChart.exits, color: '#d99b3f' }
          ]"/>
        </div>
        <priority-replenishment/>
      </div>

      <div class="surface-panel">
        <div class="surface-panel__header">
          <h2>{{ t('dashboard.retailer.recent-orders') }}</h2>
          <router-link :to="{ name: 'orders' }" class="text-sm dashboard-link">{{ t('common.view-all') }}</router-link>
        </div>
        <pv-data-table :value="ordersStore.orders.slice(0, 5)" data-key="id" size="small">
          <template #empty><span class="text-muted">{{ t('orders.empty.title') }}</span></template>
          <pv-column field="code" :header="t('orders.fields.order')"/>
          <pv-column field="customerName" :header="t('orders.fields.customer')"/>
          <pv-column :header="t('orders.fields.total')">
            <template #body="{ data }">{{ data.total.format(locale) }}</template>
          </pv-column>
          <pv-column :header="t('orders.fields.status')">
            <template #body="{ data }"><order-status-tag :status="data.status"/></template>
          </pv-column>
        </pv-data-table>
        <p v-if="alertsStore.pendingCount" class="text-sm mt-3">
          <i class="pi pi-bell text-orange-700" aria-hidden="true"></i>
          <router-link :to="{ name: 'alerts-inbox' }" class="dashboard-link"> {{ t('alerts.pending-count', { count: alertsStore.pendingCount }) }}</router-link>
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard-link {
  color: var(--color-primary);
  font-weight: 500;
}
</style>
