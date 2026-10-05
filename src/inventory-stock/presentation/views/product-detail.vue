<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useAnalyticsStore } from '@/analytics-estimations/application/analytics.store.js';
import { RegisterStockMovementCommand } from '@/inventory-stock/domain/model/register-stock-movement.command.js';
import { MovementType } from '@/inventory-stock/domain/model/stock-movement.entity.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import KpiCard from '@/shared/presentation/components/kpi-card.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import StockStatusTag from '@/inventory-stock/presentation/components/stock-status-tag.vue';
import StockMovementDialog from '@/inventory-stock/presentation/components/stock-movement-dialog.vue';
import ThresholdDialog from '@/inventory-stock/presentation/components/threshold-dialog.vue';
import ProductFormDialog from '@/inventory-stock/presentation/components/product-form-dialog.vue';
import ReplenishmentEstimateCard from '@/analytics-estimations/presentation/components/replenishment-estimate-card.vue';


const props = defineProps({ productId: { type: [String, Number], required: true } });
const { t, locale } = useI18n();
const toast = useToast();
const inventoryStore = useInventoryStore();
const analyticsStore = useAnalyticsStore();

const movementDialogVisible = ref(false);
const thresholdDialogVisible = ref(false);
const productDialogVisible = ref(false);
const saving = ref(false);

const item = computed(() => inventoryStore.findInventoryItem(props.productId));
const movements = computed(() => inventoryStore.movementsForProduct(props.productId));

const notify = (succeeded, successKey) => {
  const error = inventoryStore.errors[0];
  toast.add(succeeded
      ? { severity: 'success', summary: t(successKey), life: 3000 }
      : { severity: 'error', summary: t('common.error'), detail: t(`inventory.errors.${error}`, error), life: 4000 });
};

const refreshEstimate = () => analyticsStore.fetchAnalytics({ force: true });

const onSaveMovement = async form => {
  saving.value = true;
  const movement = await inventoryStore.registerStockMovement(new RegisterStockMovementCommand(form));
  saving.value = false;
  notify(movement !== null, 'inventory.toasts.movement-registered');
  if (movement) {
    movementDialogVisible.value = false;
    refreshEstimate();
  }
};

const onSaveThreshold = async threshold => {
  saving.value = true;
  const saved = await inventoryStore.configureLowStockThreshold(item.value.stockItem, threshold);
  saving.value = false;
  notify(saved, 'inventory.toasts.threshold-saved');
  if (saved) {
    thresholdDialogVisible.value = false;
    refreshEstimate();
  }
};

const onSaveProduct = async form => {
  saving.value = true;
  const { initialQuantity, lowStockThreshold, ...changes } = form;
  const saved = await inventoryStore.updateProduct(item.value.product, changes);
  saving.value = false;
  notify(saved, 'inventory.toasts.product-updated');
  if (saved) productDialogVisible.value = false;
};

onMounted(async () => {
  await inventoryStore.fetchInventory({ force: true });
  await analyticsStore.fetchAnalytics({ force: true });
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <router-link :to="{ name: 'inventory' }" class="back-link">
      <i class="pi pi-arrow-left" aria-hidden="true"></i> {{ t('inventory.back') }}
    </router-link>

    <template v-if="item">
      <page-header :title="item.product.name" :subtitle="`${item.product.presentation} · ${item.product.category || '—'}`">
        <template #actions>
          <pv-button icon="pi pi-pencil" :label="t('common.edit')" text @click="productDialogVisible = true"/>
          <pv-button icon="pi pi-sliders-h" :label="t('inventory.configure-threshold')" outlined
                     @click="thresholdDialogVisible = true"/>
          <pv-button icon="pi pi-arrow-right-arrow-left" :label="t('inventory.register-movement')"
                     @click="movementDialogVisible = true"/>
        </template>
      </page-header>

      <div class="kpi-grid">
        <kpi-card :label="t('inventory.fields.stock')" :value="item.stockItem.currentQuantity"
                  :caption="t(`inventory.units.${item.product.unit}`)"/>
        <kpi-card :label="t('inventory.fields.threshold')" :value="item.stockItem.lowStockThreshold"
                  :caption="t('inventory.kpis.threshold-caption')"/>
        <kpi-card :label="t('inventory.fields.unit-price')" :value="item.product.unitPrice.format(locale)"
                  :caption="item.product.sku || '—'"/>
        <article class="kpi-card-like surface-panel flex flex-column gap-2">
          <span class="text-muted text-sm">{{ t('inventory.fields.status') }}</span>
          <stock-status-tag :status="item.stockItem.status" class="align-self-start"/>
        </article>
      </div>

      <div class="content-grid">
        <div class="surface-panel">
          <div class="surface-panel__header">
            <h2>{{ t('inventory.movements.title') }}</h2>
            <span class="text-muted text-sm">{{ t('inventory.movements.count', { count: movements.length }) }}</span>
          </div>
          <pv-data-table :value="movements" paginator :rows="8" data-key="id" striped-rows>
            <template #empty>
              <empty-state icon="pi pi-history" :title="t('inventory.movements.empty')"/>
            </template>
            <pv-column :header="t('common.date')">
              <template #body="{ data }">{{ data.movementDate.formatWithTime(locale) }}</template>
            </pv-column>
            <pv-column :header="t('inventory.fields.movement-type')">
              <template #body="{ data }">
                <pv-tag :value="t(`inventory.movement-type.${data.type}`)"
                        :severity="data.type === MovementType.IN ? 'success' : 'warn'"
                        :icon="data.type === MovementType.IN ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"/>
              </template>
            </pv-column>
            <pv-column :header="t('inventory.fields.quantity')">
              <template #body="{ data }">
                <span :class="data.type === MovementType.IN ? 'text-green-700' : 'text-orange-700'" class="font-semibold">
                  {{ data.signedQuantity > 0 ? '+' : '' }}{{ data.signedQuantity }}
                </span>
              </template>
            </pv-column>
            <pv-column :header="t('inventory.fields.reason')">
              <template #body="{ data }">{{ t(`inventory.movement-reason.${data.reason}`) }}</template>
            </pv-column>
            <pv-column :header="t('inventory.fields.reference')">
              <template #body="{ data }">{{ data.reference || data.notes || '—' }}</template>
            </pv-column>
          </pv-data-table>
        </div>
        <replenishment-estimate-card :product-id="item.product.id"/>
      </div>
    </template>

    <div v-else-if="inventoryStore.loading" class="surface-panel">
      <pv-skeleton height="12rem"/>
    </div>
    <div v-else class="surface-panel">
      <empty-state icon="pi pi-search" :title="t('inventory.not-found')"/>
    </div>

    <template v-if="item">
      <stock-movement-dialog v-model:visible="movementDialogVisible" :inventory-items="[item]"
                             :product-id="item.product.id" :saving="saving" @save="onSaveMovement"/>
      <threshold-dialog v-model:visible="thresholdDialogVisible" :product-name="item.product.displayName"
                        :current-threshold="item.stockItem.lowStockThreshold" :saving="saving" @save="onSaveThreshold"/>
      <product-form-dialog v-model:visible="productDialogVisible" :product="item.product" :saving="saving"
                           @save="onSaveProduct"/>
    </template>
  </section>
</template>

<style scoped>
.back-link {
  color: var(--color-primary);
  font-weight: 500;
  font-size: 0.9rem;
  align-self: flex-start;
}
</style>
