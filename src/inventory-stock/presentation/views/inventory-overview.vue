<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { RegisterStockMovementCommand } from '@/inventory-stock/domain/model/register-stock-movement.command.js';
import { StockStatus } from '@/inventory-stock/domain/model/stock-item.entity.js';
import { Money } from '@/shared/domain/model/money.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import KpiCard from '@/shared/presentation/components/kpi-card.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import StockStatusTag from '@/inventory-stock/presentation/components/stock-status-tag.vue';
import ProductFormDialog from '@/inventory-stock/presentation/components/product-form-dialog.vue';
import StockMovementDialog from '@/inventory-stock/presentation/components/stock-movement-dialog.vue';
import ThresholdDialog from '@/inventory-stock/presentation/components/threshold-dialog.vue';


const { t, locale } = useI18n();
const router = useRouter();
const toast = useToast();
const inventoryStore = useInventoryStore();

const search = ref('');
const statusFilter = ref('ALL');
const productDialogVisible = ref(false);
const movementDialogVisible = ref(false);
const thresholdDialogVisible = ref(false);
const selectedItem = ref(null);
const saving = ref(false);

const statusOptions = computed(() => [
  { value: 'ALL', label: t('common.all') },
  ...Object.values(StockStatus).map(status => ({ value: status, label: t(`inventory.status.${status}`) }))
]);

const filteredItems = computed(() => {
  const term = search.value.trim().toLowerCase();
  return inventoryStore.inventoryItems
      .filter(item => statusFilter.value === 'ALL' || item.stockItem.status === statusFilter.value)
      .filter(item => !term || [item.product.name, item.product.category, item.product.sku]
          .some(value => value?.toLowerCase().includes(term)));
});

const categoriesCount = computed(() => new Set(inventoryStore.products.map(product => product.category).filter(Boolean)).size);
const inventoryValueLabel = computed(() => new Money(inventoryStore.inventoryValue).format(locale.value));


const notify = (succeeded, successKey) => {
  const error = inventoryStore.errors[0];
  toast.add(succeeded
      ? { severity: 'success', summary: t(successKey), life: 3000 }
      : { severity: 'error', summary: t('common.error'), detail: t(`inventory.errors.${error}`, error), life: 4000 });
};

const onSaveProduct = async form => {
  saving.value = true;
  const { initialQuantity, lowStockThreshold, ...productData } = form;
  const product = await inventoryStore.registerProduct(productData, initialQuantity, lowStockThreshold);
  saving.value = false;
  notify(product !== null, 'inventory.toasts.product-registered');
  if (product) productDialogVisible.value = false;
};

const openMovementDialog = (item = null) => {
  selectedItem.value = item;
  movementDialogVisible.value = true;
};

const onSaveMovement = async form => {
  saving.value = true;
  const movement = await inventoryStore.registerStockMovement(new RegisterStockMovementCommand(form));
  saving.value = false;
  notify(movement !== null, 'inventory.toasts.movement-registered');
  if (movement) movementDialogVisible.value = false;
};

const openThresholdDialog = item => {
  selectedItem.value = item;
  thresholdDialogVisible.value = true;
};

const onSaveThreshold = async threshold => {
  saving.value = true;
  const saved = await inventoryStore.configureLowStockThreshold(selectedItem.value.stockItem, threshold);
  saving.value = false;
  notify(saved, 'inventory.toasts.threshold-saved');
  if (saved) thresholdDialogVisible.value = false;
};

const goToDetail = item => router.push({ name: 'product-detail', params: { productId: item.product.id } });

onMounted(() => inventoryStore.fetchInventory({ force: true }));
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('inventory.title')" :subtitle="t('inventory.subtitle')">
      <template #actions>
        <pv-button icon="pi pi-arrow-right-arrow-left" :label="t('inventory.register-movement')" outlined
                   :disabled="!inventoryStore.inventoryItems.length" @click="openMovementDialog()"/>
        <pv-button icon="pi pi-plus" :label="t('inventory.new-product')" @click="productDialogVisible = true"/>
      </template>
    </page-header>

    <div class="kpi-grid">
      <kpi-card :label="t('inventory.kpis.products')" :value="inventoryStore.products.length" icon="pi pi-tags"
                :caption="t('inventory.kpis.categories', { count: categoriesCount })" :loading="inventoryStore.loading"/>
      <kpi-card :label="t('inventory.kpis.units')" :value="inventoryStore.totalUnits.toLocaleString(locale)" icon="pi pi-box"
                :caption="t('inventory.kpis.units-caption')" :loading="inventoryStore.loading"/>
      <kpi-card :label="t('inventory.kpis.low-stock')" :value="inventoryStore.lowStockItems.length"
                icon="pi pi-exclamation-triangle" :caption="t('inventory.kpis.low-stock-caption')"
                :tone="inventoryStore.lowStockItems.length ? 'warn' : 'success'" :loading="inventoryStore.loading"/>
      <kpi-card :label="t('inventory.kpis.value')" :value="inventoryValueLabel" icon="pi pi-wallet"
                :caption="t('inventory.kpis.value-caption')" tone="success" :loading="inventoryStore.loading"/>
    </div>

    <div class="surface-panel">
      <div class="surface-panel__header">
        <pv-icon-field>
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text v-model="search" :placeholder="t('inventory.search-placeholder')"
                         :aria-label="t('inventory.search-placeholder')"/>
        </pv-icon-field>
        <pv-select-button v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value"
                          :allow-empty="false" :aria-label="t('inventory.fields.status')"/>
      </div>

      <pv-data-table :value="filteredItems" :loading="inventoryStore.loading" data-key="product.id" paginator :rows="10"
                     striped-rows responsive-layout="scroll" row-hover @row-click="event => goToDetail(event.data)"
                     class="cursor-pointer">
        <template #empty>
          <empty-state icon="pi pi-box" :title="t('inventory.empty.title')" :description="t('inventory.empty.description')">
            <pv-button icon="pi pi-plus" :label="t('inventory.new-product')" @click="productDialogVisible = true"/>
          </empty-state>
        </template>
        <pv-column :header="t('inventory.fields.product')" sortable sort-field="product.name">
          <template #body="{ data }">
            <div class="flex flex-column">
              <span class="font-semibold">{{ data.product.name }}</span>
              <span class="text-muted text-sm">{{ data.product.category }}</span>
            </div>
          </template>
        </pv-column>
        <pv-column field="product.presentation" :header="t('inventory.fields.presentation')"/>
        <pv-column :header="t('inventory.fields.stock')" sortable sort-field="stockItem.currentQuantity">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.stockItem.currentQuantity }}</span>
            <span class="text-muted text-sm"> {{ t(`inventory.units.${data.product.unit}`) }}</span>
          </template>
        </pv-column>
        <pv-column field="stockItem.lowStockThreshold" :header="t('inventory.fields.threshold')"/>
        <pv-column :header="t('inventory.fields.status')">
          <template #body="{ data }">
            <stock-status-tag :status="data.stockItem.status"/>
          </template>
        </pv-column>
        <pv-column :header="t('common.actions')" style="width: 9rem">
          <template #body="{ data }">
            <div class="flex gap-1" @click.stop>
              <pv-button icon="pi pi-arrow-right-arrow-left" text rounded v-tooltip.top="t('inventory.register-movement')"
                         :aria-label="t('inventory.register-movement')" @click="openMovementDialog(data)"/>
              <pv-button icon="pi pi-sliders-h" text rounded v-tooltip.top="t('inventory.configure-threshold')"
                         :aria-label="t('inventory.configure-threshold')" @click="openThresholdDialog(data)"/>
              <pv-button icon="pi pi-eye" text rounded v-tooltip.top="t('common.view-detail')"
                         :aria-label="t('common.view-detail')" @click="goToDetail(data)"/>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <product-form-dialog v-model:visible="productDialogVisible" :saving="saving" @save="onSaveProduct"/>
    <stock-movement-dialog v-model:visible="movementDialogVisible" :inventory-items="inventoryStore.inventoryItems"
                           :product-id="selectedItem?.product.id ?? null" :saving="saving" @save="onSaveMovement"/>
    <threshold-dialog v-model:visible="thresholdDialogVisible" :product-name="selectedItem?.product.displayName ?? ''"
                      :current-threshold="selectedItem?.stockItem.lowStockThreshold ?? 0" :saving="saving"
                      @save="onSaveThreshold"/>
  </section>
</template>
