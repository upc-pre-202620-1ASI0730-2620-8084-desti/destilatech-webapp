<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import { AlertStatus, AlertType } from '@/alerts-notifications/domain/model/alert.entity.js';
import { useIamStore } from '@/iam/application/iam.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import AlertItem from '@/alerts-notifications/presentation/components/alert-item.vue';


const { t } = useI18n();
const toast = useToast();
const alertsStore = useAlertsStore();
const iamStore = useIamStore();

const typeFilter = ref('ALL');
const statusFilter = ref(AlertStatus.PENDING);

const countByType = type => alertsStore.alerts.filter(alert => type === 'ALL' || alert.type === type).length;

const typeOptions = computed(() => {
  const options = [{ value: 'ALL', label: `${t('alerts.filters.all')} ${countByType('ALL')}` }];
  if (iamStore.isProducer) {
    options.push({ value: AlertType.ANOMALY, label: `${t('alerts.filters.production')} ${countByType(AlertType.ANOMALY)}` });
  }
  options.push({ value: AlertType.LOW_STOCK, label: `${t('alerts.filters.inventory')} ${countByType(AlertType.LOW_STOCK)}` });
  return options;
});

const statusOptions = computed(() => [
  { value: AlertStatus.PENDING, label: t('alerts.filters.pending') },
  { value: AlertStatus.ATTENDED, label: t('alerts.filters.attended') },
  { value: 'ALL', label: t('alerts.filters.all') }
]);

const filteredAlerts = computed(() => alertsStore.alerts
    .filter(alert => typeFilter.value === 'ALL' || alert.type === typeFilter.value)
    .filter(alert => statusFilter.value === 'ALL' || alert.status === statusFilter.value));


const onAttend = async alert => {
  if (await alertsStore.markAsAttended(alert)) {
    toast.add({ severity: 'success', summary: t('alerts.attended-toast'), life: 2500 });
  }
};

onMounted(() => alertsStore.fetchAlerts());
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('alerts.title')" :subtitle="t('alerts.subtitle')"
                 :badge="t('alerts.pending-count', { count: alertsStore.pendingCount })"/>

    <div class="flex gap-3 flex-wrap justify-content-between">
      <pv-select-button v-model="typeFilter" :options="typeOptions" option-label="label" option-value="value"
                        :allow-empty="false" :aria-label="t('alerts.filters.type')"/>
      <pv-select-button v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value"
                        :allow-empty="false" :aria-label="t('alerts.filters.status')"/>
    </div>

    <div v-if="alertsStore.loading" class="flex flex-column gap-2">
      <pv-skeleton v-for="index in 4" :key="index" height="4.5rem"/>
    </div>
    <div v-else-if="filteredAlerts.length" class="flex flex-column gap-2">
      <alert-item v-for="alert in filteredAlerts" :key="alert.id" :alert="alert" @attend="onAttend"/>
    </div>
    <div v-else class="surface-panel">
      <empty-state icon="pi pi-check-circle" :title="t('alerts.empty.title')" :description="t('alerts.empty.description')"/>
    </div>
  </section>
</template>
