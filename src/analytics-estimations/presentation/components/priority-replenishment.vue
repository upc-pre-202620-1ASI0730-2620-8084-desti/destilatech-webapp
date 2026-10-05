<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useAnalyticsStore } from '@/analytics-estimations/application/analytics.store.js';


const props = defineProps({ limit: { type: Number, default: 5 } });
const { t } = useI18n();
const inventoryStore = useInventoryStore();
const analyticsStore = useAnalyticsStore();

const rows = computed(() => {
  const lowStock = inventoryStore.lowStockItems.map(item => ({ item, estimate: analyticsStore.estimateFor(item.product.id) }));
  const soon = analyticsStore.urgentEstimates
      .filter(estimate => estimate.isUrgent())
      .filter(estimate => !lowStock.some(row => row.item.product.id === estimate.productId))
      .map(estimate => ({ item: inventoryStore.findInventoryItem(estimate.productId), estimate }))
      .filter(row => row.item);
  return [...lowStock, ...soon].slice(0, props.limit);
});

const caption = row => {
  if (row.estimate?.hasEnoughData) {
    return row.estimate.daysUntilThreshold === 0
        ? t('analytics.estimate.replenish-now')
        : t('analytics.estimate.in-days', { days: row.estimate.daysUntilThreshold }, row.estimate.daysUntilThreshold);
  }
  return t('dashboard.below-threshold', { threshold: row.item.stockItem.lowStockThreshold });
};
</script>

<template>
  <div class="surface-panel priority-replenishment">
    <div class="flex justify-content-between align-items-center">
      <h2>{{ t('dashboard.priority-replenishment') }}</h2>
      <router-link :to="{ name: 'replenishment-orders' }" class="text-sm priority-replenishment__link">{{ t('common.view-all') }}</router-link>
    </div>
    <ul v-if="rows.length">
      <li v-for="row in rows" :key="row.item.product.id">
        <router-link :to="{ name: 'product-detail', params: { productId: row.item.product.id } }" class="flex flex-column">
          <span class="font-medium">{{ row.item.product.name }}</span>
          <span class="text-xs text-muted">{{ caption(row) }}</span>
        </router-link>
        <strong :class="row.item.stockItem.isBelowThreshold() ? 'text-orange-700' : 'text-color'">
          {{ row.item.stockItem.currentQuantity }} {{ t('analytics.estimate.units') }}
        </strong>
      </li>
    </ul>
    <p v-else class="text-muted text-sm">{{ t('dashboard.no-replenishment') }}</p>
  </div>
</template>

<style scoped>
.priority-replenishment {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
}

.priority-replenishment ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.priority-replenishment li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.priority-replenishment__link {
  color: var(--color-primary);
  font-weight: 500;
}
</style>
