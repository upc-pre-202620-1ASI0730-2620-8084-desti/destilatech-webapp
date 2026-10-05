<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAnalyticsStore } from '@/analytics-estimations/application/analytics.store.js';
import { ANALYSIS_WINDOW_DAYS, COVERAGE_DAYS, MIN_EXIT_MOVEMENTS } from '@/analytics-estimations/domain/model/replenishment-estimate.entity.js';


const props = defineProps({ productId: { type: Number, required: true } });
const { t, locale } = useI18n();
const analyticsStore = useAnalyticsStore();

const estimate = computed(() => analyticsStore.estimateFor(props.productId));
const confidencePercent = computed(() => Math.round((estimate.value?.confidence ?? 0) * 100));
const headline = computed(() => {
  if (!estimate.value?.hasEnoughData) return '';
  if (estimate.value.daysUntilThreshold === 0) return t('analytics.estimate.replenish-now');
  return t('analytics.estimate.in-days', { days: estimate.value.daysUntilThreshold }, estimate.value.daysUntilThreshold);
});
</script>

<template>
  <aside class="surface-panel estimate-card">
    <div class="flex align-items-center gap-2">
      <i class="pi pi-chart-line estimate-card__icon" aria-hidden="true"></i>
      <h2>{{ t('analytics.estimate.title') }}</h2>
    </div>

    <pv-skeleton v-if="analyticsStore.loading && !estimate" height="8rem"/>

    <template v-else-if="estimate?.hasEnoughData">
      <p class="estimate-card__headline" :class="{ 'estimate-card__headline--urgent': estimate.isUrgent() }">{{ headline }}</p>
      <dl class="estimate-card__facts">
        <dt>{{ t('analytics.estimate.estimated-date') }}</dt>
        <dd>{{ estimate.estimatedDate.format(locale) }}</dd>
        <dt>{{ t('analytics.estimate.daily-consumption') }}</dt>
        <dd>{{ estimate.averageDailyConsumption }} {{ t('analytics.estimate.units-per-day') }}</dd>
        <dt>{{ t('analytics.estimate.suggested-quantity') }}</dt>
        <dd>{{ estimate.suggestedQuantity }} {{ t('analytics.estimate.units') }}</dd>
      </dl>
      <div class="flex flex-column gap-1">
        <span class="text-sm text-muted">{{ t('analytics.estimate.confidence', { value: confidencePercent }) }}</span>
        <pv-progress-bar :value="confidencePercent" :show-value="false" style="height: 0.45rem"/>
      </div>
      <p class="text-xs text-muted">
        {{ t('analytics.estimate.method', { window: ANALYSIS_WINDOW_DAYS, coverage: COVERAGE_DAYS, exits: estimate.exitsAnalyzed }) }}
      </p>
    </template>

    <template v-else>
      <p class="text-muted">{{ t('analytics.estimate.not-enough-data', { minimum: MIN_EXIT_MOVEMENTS, window: ANALYSIS_WINDOW_DAYS }) }}</p>
    </template>
  </aside>
</template>

<style scoped>
.estimate-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
  align-self: start;
}

.estimate-card__icon {
  color: var(--color-accent);
  font-size: 1.2rem;
}

.estimate-card__headline {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-success);
}

.estimate-card__headline--urgent {
  color: var(--color-warn);
}

.estimate-card__facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  margin: 0;
}

.estimate-card__facts dt {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.estimate-card__facts dd {
  margin: 0;
  font-weight: 600;
}
</style>
