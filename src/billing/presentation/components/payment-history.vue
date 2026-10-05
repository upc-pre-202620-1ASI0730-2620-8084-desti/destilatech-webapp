<script setup>
import { useI18n } from 'vue-i18n';
import { useBillingStore } from '@/billing/application/billing.store.js';
import EmptyState from '@/shared/presentation/components/empty-state.vue';


const { t, locale } = useI18n();
const billingStore = useBillingStore();

const planName = planId => {
  const plan = billingStore.findPlan(planId);
  return plan ? t(`billing.plans.${plan.code}.name`) : '—';
};
</script>

<template>
  <div class="surface-panel">
    <h2 class="mb-3">{{ t('billing.payments.title') }}</h2>
    <pv-data-table :value="billingStore.payments" :loading="billingStore.loading" data-key="id" size="small">
      <template #empty>
        <empty-state icon="pi pi-credit-card" :title="t('billing.payments.empty')"/>
      </template>
      <pv-column :header="t('common.date')">
        <template #body="{ data }">{{ data.paidAt.formatWithTime(locale) }}</template>
      </pv-column>
      <pv-column :header="t('billing.payments.plan')">
        <template #body="{ data }">{{ planName(data.planId) }}</template>
      </pv-column>
      <pv-column :header="t('billing.payments.amount')">
        <template #body="{ data }">{{ data.amount.format() }}</template>
      </pv-column>
      <pv-column :header="t('billing.payments.card')">
        <template #body="{ data }">{{ data.maskedCard || '—' }}</template>
      </pv-column>
      <pv-column :header="t('billing.payments.provider')">
        <template #body="{ data }"><pv-tag :value="data.provider" severity="secondary"/></template>
      </pv-column>
      <pv-column :header="t('orders.fields.status')">
        <template #body="{ data }"><pv-tag :value="t(`billing.payments.status.${data.status}`)" severity="success"/></template>
      </pv-column>
    </pv-data-table>
  </div>
</template>
