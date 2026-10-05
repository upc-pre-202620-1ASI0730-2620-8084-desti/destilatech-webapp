<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useOrdersStore } from '@/orders-replenishment/application/orders.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useAnalyticsStore } from '@/analytics-estimations/application/analytics.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import OrderStatusTag from '@/orders-replenishment/presentation/components/order-status-tag.vue';
import ReplenishmentFormDialog from '@/orders-replenishment/presentation/components/replenishment-form-dialog.vue';
import StockStatusTag from '@/inventory-stock/presentation/components/stock-status-tag.vue';

/**
 * Replenishment flow (section 4.4.4): detect low stock, request the
 * replenishment to a supplier and update the stock when it is received.
 */
const { t, locale } = useI18n();
const toast = useToast();
const ordersStore = useOrdersStore();
const inventoryStore = useInventoryStore();
const analyticsStore = useAnalyticsStore();

const dialogVisible = ref(false);
const suggestion = ref(null);
const saving = ref(false);

const suppliers = computed(() => [...new Set(ordersStore.replenishmentOrders.map(order => order.supplierName))]);

/** Low-stock products without a pending replenishment, with a suggested quantity. */
const suggestions = computed(() => {
  const pendingProductIds = new Set(ordersStore.pendingReplenishments.map(order => order.productId));
  return inventoryStore.lowStockItems
      .filter(item => !pendingProductIds.has(item.product.id))
      .map(item => {
        const estimate = analyticsStore.estimateFor(item.product.id);
        const fallback = Math.max(item.stockItem.lowStockThreshold * 2 - item.stockItem.currentQuantity, 1);
        return { item, quantity: estimate?.hasEnoughData ? Math.max(estimate.suggestedQuantity, 1) : fallback };
      });
});

const openDialog = (row = null) => {
  suggestion.value = row ? { productId: row.item.product.id, quantity: row.quantity } : null;
  dialogVisible.value = true;
};

const showError = () => {
  const error = ordersStore.errors[0];
  toast.add({ severity: 'error', summary: t('common.error'), detail: t(`orders.errors.${error}`, error), life: 4000 });
};

const onSave = async form => {
  saving.value = true;
  const created = await ordersStore.requestReplenishment(form);
  saving.value = false;
  if (!created) return showError();
  dialogVisible.value = false;
  toast.add({ severity: 'success', summary: t('orders.toasts.replenishment-requested', { code: created.code }), life: 3000 });
};

const onReceive = async replenishment => {
  if (await ordersStore.receiveReplenishment(replenishment)) {
    toast.add({ severity: 'success', summary: t('orders.toasts.replenishment-received', { quantity: replenishment.quantity }), life: 3000 });
  } else {
    showError();
  }
};

const onCancel = async replenishment => {
  if (await ordersStore.cancelReplenishment(replenishment)) {
    toast.add({ severity: 'info', summary: t('orders.toasts.replenishment-cancelled'), life: 3000 });
  } else {
    showError();
  }
};

onMounted(() => {
  ordersStore.fetchOrders({ force: true });
  inventoryStore.fetchInventory({ force: true });
  analyticsStore.fetchAnalytics({ force: true });
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('orders.replenishment.title')" :subtitle="t('orders.replenishment.subtitle')">
      <template #actions>
        <pv-button icon="pi pi-plus" :label="t('orders.replenishment.new')" @click="openDialog()"/>
      </template>
    </page-header>

    <div class="surface-panel">
      <div class="surface-panel__header">
        <h2>{{ t('orders.replenishment.suggestions') }}</h2>
        <span class="text-muted text-sm">{{ t('orders.replenishment.suggestions-caption') }}</span>
      </div>
      <div v-if="suggestions.length" class="suggestions-grid">
        <article v-for="row in suggestions" :key="row.item.product.id" class="suggestion-card">
          <div class="flex justify-content-between align-items-start gap-2">
            <div>
              <strong>{{ row.item.product.name }}</strong>
              <p class="text-muted text-sm">{{ row.item.product.presentation }}</p>
            </div>
            <stock-status-tag :status="row.item.stockItem.status"/>
          </div>
          <p class="text-sm">
            {{ t('orders.replenishment.stock-vs-threshold', { stock: row.item.stockItem.currentQuantity, threshold: row.item.stockItem.lowStockThreshold }) }}
          </p>
          <pv-button icon="pi pi-truck" size="small" :label="t('orders.replenishment.request', { quantity: row.quantity })"
                     @click="openDialog(row)"/>
        </article>
      </div>
      <empty-state v-else icon="pi pi-check-circle" :title="t('orders.replenishment.no-suggestions')"/>
    </div>

    <div class="surface-panel">
      <h2 class="mb-3">{{ t('orders.replenishment.history') }}</h2>
      <pv-data-table :value="ordersStore.replenishmentOrders" :loading="ordersStore.loading" data-key="id" paginator :rows="10" striped-rows>
        <template #empty>
          <empty-state icon="pi pi-truck" :title="t('orders.replenishment.empty')"/>
        </template>
        <pv-column field="code" :header="t('orders.fields.code')">
          <template #body="{ data }"><span class="font-semibold">{{ data.code }}</span></template>
        </pv-column>
        <pv-column field="productName" :header="t('inventory.fields.product')"/>
        <pv-column field="quantity" :header="t('inventory.fields.quantity')"/>
        <pv-column :header="t('orders.fields.supplier')">
          <template #body="{ data }">
            <div class="flex flex-column">
              <span>{{ data.supplierName }}</span>
              <span class="text-muted text-sm">{{ data.supplierContact }}</span>
            </div>
          </template>
        </pv-column>
        <pv-column :header="t('common.date')">
          <template #body="{ data }">
            <div class="flex flex-column text-sm">
              <span>{{ data.orderDate.format(locale) }}</span>
              <span v-if="data.expectedDate" class="text-muted">{{ t('orders.replenishment.expected', { date: data.expectedDate.format(locale) }) }}</span>
            </div>
          </template>
        </pv-column>
        <pv-column :header="t('orders.fields.status')">
          <template #body="{ data }"><order-status-tag :status="data.status" namespace="orders.replenishment.status"/></template>
        </pv-column>
        <pv-column :header="t('common.actions')" style="width: 11rem">
          <template #body="{ data }">
            <div v-if="data.isPending()" class="flex gap-1">
              <pv-button icon="pi pi-check" size="small" :label="t('orders.replenishment.receive')" outlined @click="onReceive(data)"/>
              <pv-button icon="pi pi-times" text rounded severity="danger" :aria-label="t('common.cancel')" @click="onCancel(data)"/>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <replenishment-form-dialog v-model:visible="dialogVisible" :inventory-items="inventoryStore.inventoryItems"
                               :suggestion="suggestion" :suppliers="suppliers" :saving="saving" @save="onSave"/>
  </section>
</template>

<style scoped>
.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--spacing-02);
}

.suggestion-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-02);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--color-bg-alt);
}
</style>
