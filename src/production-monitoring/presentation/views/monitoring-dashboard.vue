<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useProductionStore } from '@/production-monitoring/application/production.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import VariableCard from '@/production-monitoring/presentation/components/variable-card.vue';
import ReadingsChart from '@/production-monitoring/presentation/components/readings-chart.vue';
import VariableRangeDialog from '@/production-monitoring/presentation/components/variable-range-dialog.vue';
import BatchStageTag from '@/production-monitoring/presentation/components/batch-stage-tag.vue';


const SIMULATION_INTERVAL_MS = 5000;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const productionStore = useProductionStore();

const selectedBatchId = ref(null);
const selectedVariableId = ref(null);
const liveSimulation = ref(false);
const simulating = ref(false);
const rangeDialogVisible = ref(false);
const variableToConfigure = ref(null);
const saving = ref(false);
let simulationTimer = null;

const batchOptions = computed(() => productionStore.activeBatches.map(batch => ({
  value: batch.id,
  label: `${batch.code} · ${batch.variety} · ${t(`production.stages.${batch.stage}`)}${batch.tank ? ` · ${batch.tank}` : ''}`
})));

const selectedBatch = computed(() => productionStore.findBatch(selectedBatchId.value));
const batchVariables = computed(() => selectedBatchId.value ? productionStore.variablesForBatch(selectedBatchId.value) : []);
const selectedVariable = computed(() =>
    batchVariables.value.find(variable => variable.id === selectedVariableId.value) ?? batchVariables.value[0] ?? null);
const chartReadings = computed(() => selectedVariable.value ? productionStore.readingsForVariable(selectedVariable.value.id, 24) : []);

const hasCurrentAnomaly = computed(() => batchVariables.value.some(variable => {
  const reading = productionStore.latestReading(variable.id);
  return reading && reading.isAnomaly();
}));

const simulateOnce = async () => {
  if (!selectedBatchId.value || simulating.value) return;
  simulating.value = true;
  const newReadings = await productionStore.simulateReadings(selectedBatchId.value);
  simulating.value = false;
  const anomalies = newReadings.filter(reading => reading.isAnomaly());
  if (anomalies.length) {
    toast.add({
      severity: 'warn',
      summary: t('production.monitoring.anomaly-toast-title'),
      detail: t('production.monitoring.anomaly-toast-detail', { count: anomalies.length }),
      life: 4000
    });
  }
};

const stopSimulation = () => {
  if (simulationTimer) clearInterval(simulationTimer);
  simulationTimer = null;
};

watch(liveSimulation, enabled => {
  stopSimulation();
  if (enabled) {
    simulateOnce();
    simulationTimer = setInterval(simulateOnce, SIMULATION_INTERVAL_MS);
  }
});

watch(selectedBatchId, batchId => {
  selectedVariableId.value = null;
  if (batchId && Number(route.query.batchId) !== batchId) router.replace({ query: { batchId } });
});

const openRangeDialog = variable => {
  variableToConfigure.value = variable;
  rangeDialogVisible.value = true;
};

const onSaveRange = async ({ minRange, maxRange }) => {
  saving.value = true;
  const saved = await productionStore.configureVariableRange(variableToConfigure.value, minRange, maxRange);
  saving.value = false;
  toast.add(saved
      ? { severity: 'success', summary: t('production.toasts.range-saved'), life: 3000 }
      : { severity: 'error', summary: t('common.error'), detail: t(`production.errors.${productionStore.errors[0]}`), life: 4000 });
  if (saved) rangeDialogVisible.value = false;
};

onMounted(async () => {
  await productionStore.fetchProduction({ force: true });
  const requestedBatch = productionStore.findBatch(route.query.batchId);
  const firstMonitored = productionStore.monitoredBatches[0] ?? productionStore.activeBatches[0];
  selectedBatchId.value = requestedBatch?.id ?? firstMonitored?.id ?? null;
});

onBeforeUnmount(stopSimulation);
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('production.monitoring.title')" :subtitle="t('production.monitoring.subtitle')"
                 :badge="t('shared.business-type.PRODUCER')"/>

    <div v-if="productionStore.activeBatches.length" class="surface-panel monitoring-toolbar">
      <div class="form-field monitoring-toolbar__batch">
        <label for="monitoring-batch">{{ t('production.fields.batch') }}</label>
        <pv-select input-id="monitoring-batch" v-model="selectedBatchId" :options="batchOptions" option-label="label"
                   option-value="value" fluid/>
      </div>
      <div class="flex align-items-center gap-3 flex-wrap">
        <pv-tag v-if="selectedBatch" :severity="hasCurrentAnomaly ? 'danger' : 'success'"
                :icon="hasCurrentAnomaly ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"
                :value="hasCurrentAnomaly ? t('production.monitoring.anomaly') : t('production.monitoring.stable')"/>
        <label class="flex align-items-center gap-2" for="live-simulation">
          <pv-toggle-switch input-id="live-simulation" v-model="liveSimulation"/>
          <span>{{ t('production.monitoring.live') }}</span>
        </label>
        <pv-button icon="pi pi-refresh" :label="t('production.monitoring.simulate')" outlined :loading="simulating"
                   @click="simulateOnce"/>
      </div>
    </div>

    <template v-if="selectedBatch">
      <div class="flex align-items-center gap-2 flex-wrap text-muted">
        <span>{{ t('production.monitoring.watching') }}</span>
        <router-link :to="{ name: 'batch-detail', params: { batchId: selectedBatch.id } }" class="font-semibold batch-link">
          {{ selectedBatch.code }}
        </router-link>
        <batch-stage-tag :stage="selectedBatch.stage"/>
      </div>

      <div class="kpi-grid">
        <variable-card v-for="variable in batchVariables" :key="variable.id" :variable="variable"
                       :reading="productionStore.latestReading(variable.id)"
                       :selected="selectedVariable?.id === variable.id"
                       @select="selectedVariableId = $event.id" @configure="openRangeDialog"/>
      </div>

      <div v-if="selectedVariable" class="surface-panel">
        <div class="surface-panel__header">
          <h2>{{ t('production.monitoring.chart-title', { variable: t(`production.variables.${selectedVariable.type}`) }) }}</h2>
          <span class="text-muted text-sm">{{ t('production.monitoring.last-readings', { count: chartReadings.length }) }}</span>
        </div>
        <readings-chart v-if="chartReadings.length" :variable="selectedVariable" :readings="chartReadings"/>
        <empty-state v-else icon="pi pi-wave-pulse" :title="t('production.monitoring.no-readings')"
                     :description="t('production.monitoring.no-readings-description')"/>
      </div>
    </template>

    <div v-else-if="!productionStore.loading" class="surface-panel">
      <empty-state icon="pi pi-objects-column" :title="t('production.monitoring.no-batches')"
                   :description="t('production.monitoring.no-batches-description')">
        <router-link :to="{ name: 'batch-management' }">
          <pv-button icon="pi pi-plus" :label="t('production.new-batch')"/>
        </router-link>
      </empty-state>
    </div>

    <variable-range-dialog v-model:visible="rangeDialogVisible" :variable="variableToConfigure" :saving="saving"
                           @save="onSaveRange"/>
  </section>
</template>

<style scoped>
.monitoring-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-02);
  flex-wrap: wrap;
}

.monitoring-toolbar__batch {
  flex: 1;
  min-width: 16rem;
  max-width: 32rem;
}

.batch-link {
  color: var(--color-primary);
}
</style>
