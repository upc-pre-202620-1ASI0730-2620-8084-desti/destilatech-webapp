<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProductionStore } from '@/production-monitoring/application/production.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useOrdersStore } from '@/orders-replenishment/application/orders.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import { BatchStage } from '@/production-monitoring/domain/model/batch-stage.js';
import { OrderStatus } from '@/orders-replenishment/domain/model/order.entity.js';
import KpiCard from '@/shared/presentation/components/kpi-card.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import TrendChart from './trend-chart.vue';
import RecentActivity from './recent-activity.vue';
import PriorityReplenishment from './priority-replenishment.vue';
import AlertItem from '@/alerts-notifications/presentation/components/alert-item.vue';


const { t, locale } = useI18n();
const productionStore = useProductionStore();
const inventoryStore = useInventoryStore();
const ordersStore = useOrdersStore();
const alertsStore = useAlertsStore();

const loading = computed(() => productionStore.loading || inventoryStore.loading);
const isEmpty = computed(() => !loading.value && !productionStore.batches.length && !inventoryStore.products.length);
const inFermentation = computed(() => productionStore.batchesInStage(BatchStage.FERMENTATION).length);
const toDispatch = computed(() => ordersStore.orders
    .filter(order => [OrderStatus.PENDING, OrderStatus.PREPARING].includes(order.status)).length);

const batchChart = computed(() => {
  const batches = [...productionStore.activeBatches].reverse().slice(-8);
  return {
    labels: batches.map(batch => batch.code.replace(/^LT-\d{4}-/, 'LT-')),
    data: batches.map(batch => batch.estimatedQuantity)
  };
});

const activityItems = computed(() => {
  const batchItems = productionStore.batches.flatMap(batch => batch.stageHistory.map((change, index) => ({
    key: `batch-${batch.id}-${index}`,
    date: change.changedAt,
    text: `${batch.code} · ${t(`production.stages.${change.stage}`)}`,
    tone: 'success',
    to: `/production/batches/${batch.id}`
  })));
  const alertItems = alertsStore.alerts.slice(0, 10).map(alert => ({
    key: `alert-${alert.id}`,
    date: alert.createdAt,
    text: t(`alerts.titles.${alert.type}`) + (alert.messageParams.product ? ` · ${alert.messageParams.product}` : alert.messageParams.batch ? ` · ${alert.messageParams.batch}` : ''),
    tone: alert.isPending() ? 'danger' : 'warn',
    to: '/alerts'
  }));
  const orderItems = ordersStore.orders.slice(0, 10).map(order => ({
    key: `order-${order.id}`,
    date: order.orderDate,
    text: t('dashboard.activity.order', { code: order.code, customer: order.customerName }),
    tone: 'info',
    to: '/orders'
  }));
  return [...batchItems, ...alertItems, ...orderItems]
      .sort((first, second) => second.date.valueOf() - first.date.valueOf())
      .slice(0, 7);
});

const formatLiters = value => `${Math.round(value).toLocaleString(locale.value)} L`;
</script>

<template>
  <div class="flex flex-column gap-4">
    <div class="kpi-grid">
      <kpi-card :label="t('dashboard.producer.active-batches')" :value="productionStore.activeBatches.length" icon="pi pi-objects-column"
                :caption="t('dashboard.producer.in-fermentation', { count: inFermentation })" tone="success" :loading="loading"/>
      <kpi-card :label="t('dashboard.producer.inventory')" :value="inventoryStore.totalUnits.toLocaleString(locale)" icon="pi pi-box"
                :caption="t('dashboard.producer.products', { count: inventoryStore.products.length })" :loading="loading"/>
      <kpi-card :label="t('dashboard.producer.alerts')" :value="alertsStore.pendingCount" icon="pi pi-bell"
                :caption="alertsStore.pendingCount ? t('dashboard.producer.need-attention') : t('dashboard.producer.all-clear')"
                :tone="alertsStore.pendingCount ? 'warn' : 'success'" :loading="alertsStore.loading"/>
      <kpi-card :label="t('dashboard.producer.orders')" :value="ordersStore.openOrders.length" icon="pi pi-shopping-cart"
                :caption="t('dashboard.producer.to-dispatch', { count: toDispatch })" tone="success" :loading="ordersStore.loading"/>
    </div>

    <div v-if="isEmpty" class="surface-panel">
      <empty-state icon="pi pi-objects-column" :title="t('dashboard.producer.empty-title')"
                   :description="t('dashboard.producer.empty-description')">
        <div class="flex gap-2 flex-wrap justify-content-center">
          <router-link :to="{ name: 'batch-management' }"><pv-button icon="pi pi-plus" :label="t('production.new-batch')"/></router-link>
          <router-link :to="{ name: 'inventory' }"><pv-button icon="pi pi-box" :label="t('inventory.new-product')" outlined/></router-link>
        </div>
      </empty-state>
    </div>

    <template v-else>
      <div class="content-grid">
        <div class="surface-panel">
          <div class="surface-panel__header">
            <h2>{{ t('dashboard.producer.batch-yield') }}</h2>
            <router-link :to="{ name: 'batch-management' }" class="text-sm dashboard-link">{{ t('common.view-all') }}</router-link>
          </div>
          <trend-chart v-if="batchChart.labels.length" :labels="batchChart.labels" :value-formatter="formatLiters"
                       :series="[{ label: t('production.fields.estimated-quantity'), data: batchChart.data }]"/>
          <empty-state v-else icon="pi pi-objects-column" :title="t('dashboard.producer.no-active-batches')"/>
        </div>
        <recent-activity :items="activityItems"/>
      </div>

      <div class="content-grid">
        <div class="surface-panel flex flex-column gap-2">
          <div class="surface-panel__header">
            <h2>{{ t('dashboard.pending-alerts') }}</h2>
            <router-link :to="{ name: 'alerts-inbox' }" class="text-sm dashboard-link">{{ t('common.view-all') }}</router-link>
          </div>
          <alert-item v-for="alert in alertsStore.pendingAlerts.slice(0, 4)" :key="alert.id" :alert="alert" compact/>
          <p v-if="!alertsStore.pendingAlerts.length" class="text-muted text-sm">{{ t('alerts.empty.title') }}</p>
        </div>
        <priority-replenishment/>
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
