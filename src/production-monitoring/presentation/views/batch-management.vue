<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useProductionStore } from '@/production-monitoring/application/production.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { RegisterBatchCommand } from '@/production-monitoring/domain/model/register-batch.command.js';
import { BatchStage, BATCH_STAGE_SEQUENCE } from '@/production-monitoring/domain/model/batch-stage.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import KpiCard from '@/shared/presentation/components/kpi-card.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import BatchStageTag from '@/production-monitoring/presentation/components/batch-stage-tag.vue';
import BatchFormDialog from '@/production-monitoring/presentation/components/batch-form-dialog.vue';
import AdvanceStageDialog from '@/production-monitoring/presentation/components/advance-stage-dialog.vue';


const { t, locale } = useI18n();
const router = useRouter();
const toast = useToast();
const productionStore = useProductionStore();
const inventoryStore = useInventoryStore();

const stageFilter = ref('ACTIVE');
const batchDialogVisible = ref(false);
const advanceDialogVisible = ref(false);
const batchToAdvance = ref(null);
const saving = ref(false);

const stageOptions = computed(() => [
  { value: 'ACTIVE', label: t('production.filters.active') },
  ...BATCH_STAGE_SEQUENCE.map(stage => ({ value: stage, label: t(`production.stages.${stage}`) })),
  { value: 'ALL', label: t('common.all') }
]);

const filteredBatches = computed(() => productionStore.batches.filter(batch => {
  if (stageFilter.value === 'ALL') return true;
  if (stageFilter.value === 'ACTIVE') return batch.isActive();
  return batch.stage === stageFilter.value;
}));

const productOptions = computed(() => inventoryStore.products.map(product => ({ value: product.id, label: product.displayName })));
const activeLiters = computed(() => productionStore.activeBatches.reduce((sum, batch) => sum + batch.estimatedQuantity, 0));

const onSaveBatch = async form => {
  saving.value = true;
  let batch = null;
  try {
    batch = await productionStore.registerBatch(new RegisterBatchCommand(form));
  } catch (error) {
    productionStore.errors.push(error.message);
  }
  saving.value = false;
  if (batch) {
    batchDialogVisible.value = false;
    toast.add({ severity: 'success', summary: t('production.toasts.batch-registered', { code: batch.code }), life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t(`production.errors.${productionStore.errors[0]}`), life: 4000 });
  }
};

const openAdvanceDialog = batch => {
  batchToAdvance.value = batch;
  advanceDialogVisible.value = true;
};

const onAdvanceStage = async details => {
  saving.value = true;
  const advanced = await productionStore.advanceBatchStage(batchToAdvance.value, details);
  saving.value = false;
  if (advanced) {
    advanceDialogVisible.value = false;
    toast.add({
      severity: 'success',
      summary: t('production.toasts.stage-updated', {
        code: batchToAdvance.value.code,
        stage: t(`production.stages.${batchToAdvance.value.stage}`)
      }),
      life: 3000
    });
  } else {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t(`production.errors.${productionStore.errors[0]}`), life: 4000 });
  }
};

const goToDetail = batch => router.push({ name: 'batch-detail', params: { batchId: batch.id } });

onMounted(() => {
  productionStore.fetchProduction({ force: true });
  inventoryStore.fetchInventory();
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('production.batches.title')"
                 :subtitle="t('production.batches.subtitle', { count: productionStore.batches.length })"
                 :badge="t('shared.business-type.PRODUCER')">
      <template #actions>
        <pv-button icon="pi pi-plus" :label="t('production.new-batch')" @click="batchDialogVisible = true"/>
      </template>
    </page-header>

    <div class="kpi-grid">
      <kpi-card :label="t('production.kpis.active-batches')" :value="productionStore.activeBatches.length"
                icon="pi pi-objects-column" :loading="productionStore.loading"
                :caption="t('production.kpis.in-fermentation', { count: productionStore.batchesInStage(BatchStage.FERMENTATION).length })"
                tone="success"/>
      <kpi-card :label="t('production.kpis.in-distillation')" :value="productionStore.batchesInStage(BatchStage.DISTILLATION).length"
                icon="pi pi-bolt" :loading="productionStore.loading"
                :caption="t('production.kpis.resting', { count: productionStore.batchesInStage(BatchStage.RESTING).length })"/>
      <kpi-card :label="t('production.kpis.liters')" :value="`${activeLiters.toLocaleString(locale)} L`" icon="pi pi-filter"
                :loading="productionStore.loading" :caption="t('production.kpis.liters-caption')"/>
      <kpi-card :label="t('production.kpis.bottled')" :value="productionStore.batchesInStage(BatchStage.BOTTLED).length"
                icon="pi pi-check-circle" :loading="productionStore.loading" :caption="t('production.kpis.bottled-caption')"/>
    </div>

    <div class="surface-panel">
      <div class="surface-panel__header">
        <pv-select v-model="stageFilter" :options="stageOptions" option-label="label" option-value="value"
                   :aria-label="t('production.fields.stage')" class="w-full md:w-16rem"/>
      </div>
      <pv-data-table :value="filteredBatches" :loading="productionStore.loading" data-key="id" paginator :rows="10"
                     striped-rows row-hover class="cursor-pointer" @row-click="event => goToDetail(event.data)">
        <template #empty>
          <empty-state icon="pi pi-objects-column" :title="t('production.batches.empty-title')"
                       :description="t('production.batches.empty-description')">
            <pv-button icon="pi pi-plus" :label="t('production.new-batch')" @click="batchDialogVisible = true"/>
          </empty-state>
        </template>
        <pv-column field="code" :header="t('production.fields.batch')" sortable>
          <template #body="{ data }"><span class="font-semibold">{{ data.code }}</span></template>
        </pv-column>
        <pv-column field="variety" :header="t('production.fields.variety')" sortable/>
        <pv-column :header="t('production.fields.stage')" sortable sort-field="stageIndex">
          <template #body="{ data }"><batch-stage-tag :stage="data.stage"/></template>
        </pv-column>
        <pv-column :header="t('production.fields.start-date')" sortable sort-field="startDate">
          <template #body="{ data }">{{ data.startDate.format(locale) }}</template>
        </pv-column>
        <pv-column :header="t('production.fields.estimated-quantity')">
          <template #body="{ data }">{{ data.estimatedQuantity.toLocaleString(locale) }} L</template>
        </pv-column>
        <pv-column field="tank" :header="t('production.fields.tank')"/>
        <pv-column :header="t('common.actions')" style="width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-1" @click.stop>
              <pv-button v-if="data.nextStage" icon="pi pi-forward" text rounded
                         v-tooltip.top="t('production.advance-stage.action')" :aria-label="t('production.advance-stage.action')"
                         @click="openAdvanceDialog(data)"/>
              <router-link v-if="data.isMonitored()" :to="{ name: 'production-monitoring', query: { batchId: data.id } }">
                <pv-button icon="pi pi-wave-pulse" text rounded v-tooltip.top="t('navigation.monitoring')"
                           :aria-label="t('navigation.monitoring')"/>
              </router-link>
            </div>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <batch-form-dialog v-model:visible="batchDialogVisible" :product-options="productOptions" :saving="saving"
                       @save="onSaveBatch"/>
    <advance-stage-dialog v-model:visible="advanceDialogVisible" :batch="batchToAdvance" :product-options="productOptions"
                          :saving="saving" @save="onAdvanceStage"/>
  </section>
</template>
