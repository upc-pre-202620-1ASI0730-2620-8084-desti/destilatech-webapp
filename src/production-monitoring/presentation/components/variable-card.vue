<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProcessVariable } from '@/production-monitoring/domain/model/process-variable.entity.js';
import { SensorReading } from '@/production-monitoring/domain/model/sensor-reading.entity.js';


const props = defineProps({
  variable: { type: ProcessVariable, required: true },
  reading: { type: SensorReading, default: null },
  selected: { type: Boolean, default: false }
});
const emit = defineEmits(['select', 'configure']);
const { t, locale } = useI18n();

const statusKey = computed(() => {
  if (!props.reading) return 'no-data';
  return props.reading.withinRange ? 'within-range' : 'out-of-range';
});
</script>

<template>
  <article class="variable-card" :class="{ 'variable-card--selected': props.selected, 'variable-card--anomaly': statusKey === 'out-of-range' }"
           tabindex="0" role="button" :aria-pressed="props.selected"
           @click="emit('select', props.variable)" @keydown.enter="emit('select', props.variable)">
    <div class="flex justify-content-between align-items-center">
      <span class="variable-card__name">{{ t(`production.variables.${props.variable.type}`) }}</span>
      <pv-button icon="pi pi-sliders-h" text rounded size="small" :aria-label="t('production.configure-range')"
                 v-tooltip.top="t('production.configure-range')" @click.stop="emit('configure', props.variable)"/>
    </div>
    <strong class="variable-card__value">
      {{ props.reading ? props.variable.formatValue(props.reading.value) : '—' }}
      <small>{{ props.variable.unit }}</small>
    </strong>
    <span class="variable-card__status" :class="`variable-card__status--${statusKey}`">
      {{ t(`production.reading-status.${statusKey}`) }}
    </span>
    <span class="variable-card__meta">
      {{ t('production.range', { min: props.variable.minRange, max: props.variable.maxRange, unit: props.variable.unit }) }}
      <template v-if="props.reading"> · {{ props.reading.recordedAt.formatWithTime(locale) }}</template>
    </span>
  </article>
</template>

<style scoped>
.variable-card {
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.9rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.variable-card:hover,
.variable-card:focus-visible {
  box-shadow: var(--shadow-md);
  outline: none;
}

.variable-card--selected {
  border-color: var(--color-primary);
}

.variable-card--anomaly {
  border-color: var(--color-danger);
  background: #fdf3f2;
}

.variable-card__name {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.variable-card__value {
  font-family: var(--font-heading);
  font-size: 1.7rem;
  color: var(--color-primary-dark);
}

.variable-card__value small {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.variable-card__status {
  font-size: 0.8rem;
  font-weight: 600;
}

.variable-card__status--within-range {
  color: var(--color-success);
}

.variable-card__status--out-of-range {
  color: var(--color-danger);
}

.variable-card__status--no-data {
  color: var(--color-text-muted);
}

.variable-card__meta {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}
</style>
