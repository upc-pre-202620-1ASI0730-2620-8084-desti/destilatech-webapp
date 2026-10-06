<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/shared/application/user.store.js';
import { useProductionStore } from '@/production-monitoring/application/production.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useOrdersStore } from '@/orders-replenishment/application/orders.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import { useAnalyticsStore } from '@/analytics-estimations/application/analytics.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import ProducerDashboard from '@/analytics-estimations/presentation/components/producer-dashboard.vue';
import RetailerDashboard from '@/analytics-estimations/presentation/components/retailer-dashboard.vue';


const { t } = useI18n();
const userStore = useUserStore
();
const productionStore = useProductionStore();
const inventoryStore = useInventoryStore();
const ordersStore = useOrdersStore();
const alertsStore = useAlertsStore();
const analyticsStore = useAnalyticsStore();

const greeting = computed(() => {
  const hour = new Date().getHours();
  const key = hour < 12 ? 'morning' : hour < 19 ? 'afternoon' : 'evening';
  const firstName = userStore.currentUser?.fullName.split(' ')[0] ?? '';
  return t(`dashboard.greeting.${key}`, { name: firstName });
});

onMounted(() => {
  if (userStore.isProducer) productionStore.fetchProduction({ force: true });
  inventoryStore.fetchInventory({ force: true });
  ordersStore.fetchOrders({ force: true });
  alertsStore.fetchAlerts();
  analyticsStore.fetchAnalytics({ force: true });
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="userStore.isProducer ? t('dashboard.producer.title') : t('dashboard.retailer.title')"
                 :subtitle="greeting" :badge="t(`shared.business-type.${userStore.currentUser?.businessType}`)"/>
    <producer-dashboard v-if="userStore.isProducer"/>
    <retailer-dashboard v-else/>
  </section>
</template>
