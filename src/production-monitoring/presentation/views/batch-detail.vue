<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useProductionStore } from '@/production-monitoring/application/production.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { BATCH_STAGE_SEQUENCE } from '@/production-monitoring/domain/model/batch-stage.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import BatchStageTag from '@/production-monitoring/presentation/components/batch-stage-tag.vue';
import VariableCard from '@/production-monitoring/presentation/components/variable-card.vue';
import ReadingsChart from '@/production-monitoring/presentation/components/readings-chart.vue';
import AdvanceStageDialog from '@/production-monitoring/presentation/components/advance-stage-dialog.vue';
import VariableRangeDialog from '@/production-monitoring/presentation/components/variable-range-dialog.vue';


const props = defineProps({ batchId: { type: [String, Number], required: true } });
const { t, locale } = useI18n();
const toast = useToast();
const productionStore = useProductionStore();
const inventoryStore = useInventoryStore();

const advanceDialogVisible = ref(false);
const rangeDialogVisible = ref(false);
const variableToConfigure = ref(null);
const selectedVariableId = ref(null);
const saving = ref(false);

const batch = computed(() => productionStore.findBatch(props.batchId));
const variables = computed(() => batch.value ? productionStore.variablesForBatch(batch.value.id) : []);
const selectedVariable = computed(() => variables.value.find(variable => variable.id === selectedVariableId.value) ?? variables.value[0] ?? null);
const chartReadings = computed(() => selectedVariable.value ? productionStore.readingsForVariable(selectedVariable.value.id, 48) : []);
const anomalies = computed(() => batch.value ? productionStore.anomaliesForBatch(batch.value.id).slice(0, 10) : []);
const linkedProduct = computed(() => inventoryStore.products.find(product => product.id === batch.value?.productId));
const productOptions = computed(() => inventoryStore.products.map(product => ({ value: product.id, label: product.displayName })));

const timelineItems = computed(() => {
  if (!batch.value) return [];
  return BATCH_STAGE_SEQUENCE.map(stage => {
    const change = [...batch.value.stageHistory].reverse().find(item => item.stage === stage);
    return { stage, change, completed: Boolean(change), current: stage === batch.value.stage };
  });
});

const variableById = variableId => variables.value.find(variable => variable.id === variableId);

const onAdvanceStage = async details => {
  saving.value = true;
  const advanced = await productionStore.advanceBatchStage(batch.value, details);
  saving.value = false;
  if (advanced) {
    advanceDialogVisible.value = false;
    toast.add({
      severity: 'success',
      summary: t('production.toasts.stage-updated', { code: batch.value.code, stage: t(`production.stages.${batch.value.stage}`) }),
      life: 3000
    });
  } else {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t(`production.errors.${productionStore.errors[0]}`), life: 4000 });
  }
};

const openRangeDialog = variable => {
  variableToConfigure.value = variable;
  rangeDialogVisible.value = true;
};

const onSaveRange = async ({ minRange, maxRange }) => {
  saving.value = true;
  const saved = await productionStore.configureVariableRange(variableToConfigure.value, minRange, maxRange);
  saving.value = false;
  if (saved) {
    rangeDialogVisible.value = false;
    toast.add({ severity: 'success', summary: t('production.toasts.range-saved'), life: 3000 });
  }
};

onMounted(() => {
  productionStore.fetchProduction({ force: true });
  inventoryStore.fetchInventory();
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <router-link :to="{ name: 'batch-management' }" class="back-link">
      <i class="pi pi-arrow-left" aria-hidden="true"></i> {{ t('production.batches.back') }}
    </router-link>

    <template v-if="batch">
      <page-header :title="t('production.detail.title', { code: batch.code })"
                   :subtitle="`${batch.variety} · ${batch.estimatedQuantity.toLocaleString(locale)} L${batch.tank ? ` · ${batch.tank}` : ''}`">
        <template #actions>
          <router-link v-if="batch.isMonitored()" :to="{ name: 'production-monitoring', query: { batchId: batch.id } }">
            <pv-button icon="pi pi-wave-pulse" :label="t('navigation.monitoring')" outlined/>
          </router-link>
          <pv-button v-if="batch.nextStage" icon="pi pi-forward"
                     :label="t('production.advance-stage.to', { stage: t(`production.stages.${batch.nextStage}`) })"
                     @click="advanceDialogVisible = true"/>
        </template>
      </page-header>

      <div class="content-grid">
        <div class="surface-panel">
          <h2 class="mb-3">{{ t('production.detail.traceability') }}</h2>
          <pv-timeline :value="timelineItems" class="batch-timeline">
            <template #marker="{ item }">
              <span class="timeline-marker" :class="{ 'timeline-marker--done': item.completed, 'timeline-marker--current': item.current }">
                <i :class="item.completed ? 'pi pi-check' : 'pi pi-circle'" aria-hidden="true"></i>
              </span>
            </template>
            <template #content="{ item }">
              <div class="flex flex-column gap-1 pb-3">
                <batch-stage-tag :stage="item.stage" class="align-self-start"/>
                <span v-if="item.change" class="text-sm">{{ item.change.changedAt.formatWithTime(locale) }}</span>
                <span v-else class="text-sm text-muted">{{ t('production.detail.pending-stage') }}</span>
                <span v-if="item.change?.notes" class="text-sm text-muted">“{{ item.change.notes }}”</span>
              </div>
            </template>
          </pv-timeline>
        </div>

        <aside class="surface-panel flex flex-column gap-3">
          <h2>{{ t('production.detail.summary') }}</h2>
          <dl class="batch-facts">
            <dt>{{ t('production.fields.stage') }}</dt>
            <dd><batch-stage-tag :stage="batch.stage"/></dd>
            <dt>{{ t('production.fields.start-date') }}</dt>
            <dd>{{ batch.startDate.format(locale) }}</dd>
            <dt>{{ t('production.fields.product') }}</dt>
            <dd>{{ linkedProduct?.displayName ?? '—' }}</dd>
            <dt>{{ t('production.fields.bottled-units') }}</dt>
            <dd>{{ batch.bottledUnits || '—' }}</dd>
            <dt>{{ t('production.detail.anomalies') }}</dt>
            <dd>{{ productionStore.anomaliesForBatch(batch.id).length }}</dd>
          </dl>
          <p v-if="batch.notes" class="text-muted text-sm">{{ batch.notes }}</p>
        </aside>
      </div>

      <div v-if="variables.length" class="flex flex-column gap-3">
        <h2>{{ t('production.detail.variables') }}</h2>
        <div class="kpi-grid">
          <variable-card v-for="variable in variables" :key="variable.id" :variable="variable"
                         :reading="productionStore.latestReading(variable.id)"
                         :selected="selectedVariable?.id === variable.id"
                         @select="selectedVariableId = $event.id" @configure="openRangeDialog"/>
        </div>
        <div v-if="selectedVariable" class="surface-panel">
          <h3 class="mb-3">{{ t('production.monitoring.chart-title', { variable: t(`production.variables.${selectedVariable.type}`) }) }}</h3>
          <readings-chart v-if="chartReadings.length" :variable="selectedVariable" :readings="chartReadings"/>
          <empty-state v-else icon="pi pi-wave-pulse" :title="t('production.monitoring.no-readings')"/>
        </div>
      </div>

      <div class="surface-panel">
        <h2 class="mb-3">{{ t('production.detail.anomaly-history') }}</h2>
        <pv-data-table :value="anomalies" data-key="id" size="small">
          <template #empty>
            <empty-state icon="pi pi-check-circle" :title="t('production.detail.no-anomalies')"/>
          </template>
          <pv-column :header="t('common.date')">
            <template #body="{ data }">{{ data.recordedAt.formatWithTime(locale) }}</template>
          </pv-column>
          <pv-column :header="t('production.fields.variable')">
            <template #body="{ data }">{{ t(`production.variables.${variableById(data.processVariableId)?.type}`) }}</template>
          </pv-column>
          <pv-column :header="t('production.fields.value')">
            <template #body="{ data }">
              <span class="text-red-700 font-semibold">{{ data.value }} {{ variableById(data.processVariableId)?.unit }}</span>
            </template>
          </pv-column>
        </pv-data-table>
      </div>
    </template>

    <div v-else-if="productionStore.loading" class="surface-panel"><pv-skeleton height="14rem"/></div>
    <div v-else class="surface-panel"><empty-state icon="pi pi-search" :title="t('production.detail.not-found')"/></div>

    <advance-stage-dialog v-model:visible="advanceDialogVisible" :batch="batch ?? null" :product-options="productOptions"
                          :saving="saving" @save="onAdvanceStage"/>
    <variable-range-dialog v-model:visible="rangeDialogVisible" :variable="variableToConfigure" :saving="saving"
                           @save="onSaveRange"/>
  </section>
</template>

<style scoped>
.back-link {
  color: var(--color-primary);
  font-weight: 500;
  font-size: 0.9rem;
  align-self: flex-start;
}

.batch-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.6rem 1rem;
  margin: 0;
}

.batch-facts dt {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.batch-facts dd {
  margin: 0;
  font-weight: 500;
}

.timeline-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  color: var(--color-border);
  background: var(--color-bg);
  font-size: 0.7rem;
}

.timeline-marker--done {
  border-color: var(--color-success);
  background: var(--color-success);
  color: #fffdf9;
}

.timeline-marker--current {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-primary-dark);
}

.batch-timeline :deep(.p-timeline-event-opposite) {
  display: none;
}
</style>
