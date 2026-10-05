<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Alert, AlertSeverity, AlertType } from '@/alerts-notifications/domain/model/alert.entity.js';

const props = defineProps({
  alert: { type: Alert, required: true },
  compact: { type: Boolean, default: false }
});
const emit = defineEmits(['attend']);
const { t, locale } = useI18n();

const icon = computed(() => props.alert.type === AlertType.ANOMALY ? 'pi pi-wave-pulse' : 'pi pi-box');
const messageParams = computed(() => {
  const params = { ...props.alert.messageParams };
  if (params.variableType) params.variable = t(`production.variables.${params.variableType}`);
  return params;
});

const tone = computed(() => {
  if (!props.alert.isPending()) return 'attended';
  return props.alert.severity === AlertSeverity.CRITICAL ? 'critical' : 'warning';
});
</script>

<template>
  <article class="alert-item" :class="`alert-item--${tone}`">
    <span class="alert-item__bar" aria-hidden="true"></span>
    <i :class="icon" class="alert-item__icon" aria-hidden="true"></i>
    <div class="alert-item__body">
      <div class="flex align-items-center gap-2 flex-wrap">
        <strong>{{ t(`alerts.titles.${props.alert.type}`) }}</strong>
        <pv-tag v-if="!props.compact" :value="t(`alerts.severity.${props.alert.severity}`)"
                :severity="props.alert.severity === 'CRITICAL' ? 'danger' : 'warn'"/>
        <pv-tag v-if="!props.alert.isPending()" :value="t('alerts.status.ATTENDED')" severity="success"/>
      </div>
      <p class="alert-item__message">{{ t(props.alert.messageKey, messageParams) }}</p>
      <span class="alert-item__date">
        {{ props.alert.createdAt.formatWithTime(locale) }}
        <template v-if="props.alert.attendedAt"> · {{ t('alerts.attended-on', { date: props.alert.attendedAt.formatWithTime(locale) }) }}</template>
      </span>
    </div>
    <div v-if="!props.compact" class="alert-item__actions">
      <router-link v-if="props.alert.link" :to="props.alert.link">
        <pv-button icon="pi pi-external-link" text rounded :aria-label="t('alerts.view-source')"
                   v-tooltip.top="t('alerts.view-source')"/>
      </router-link>
      <pv-button v-if="props.alert.isPending()" icon="pi pi-check" :label="t('alerts.mark-attended')" size="small"
                 outlined @click="emit('attend', props.alert)"/>
    </div>
  </article>
</template>

<style scoped>
.alert-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-02);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.85rem 1rem 0.85rem 0;
  overflow: hidden;
}

.alert-item__bar {
  align-self: stretch;
  width: 6px;
  border-radius: 0 4px 4px 0;
}

.alert-item--warning .alert-item__bar {
  background: var(--color-warn);
}

.alert-item--critical .alert-item__bar {
  background: var(--color-danger);
}

.alert-item--attended .alert-item__bar {
  background: var(--color-success);
}

.alert-item--attended {
  opacity: 0.8;
}

.alert-item__icon {
  color: var(--color-primary);
  font-size: 1.1rem;
}

.alert-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.alert-item__message {
  color: var(--color-text);
  font-size: 0.9rem;
}

.alert-item__date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.alert-item__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

@media (max-width: 640px) {
  .alert-item {
    flex-wrap: wrap;
  }

  .alert-item__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
