<script setup>

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  caption: { type: String, default: '' },
  icon: { type: String, default: '' },
  /** One of: neutral, success, warn, danger. Colors the caption. */
  tone: { type: String, default: 'neutral' },
  loading: { type: Boolean, default: false }
});
</script>

<template>
  <article class="kpi-card">
    <div class="kpi-card__header">
      <span class="kpi-card__label">{{ label }}</span>
      <i v-if="icon" :class="icon" class="kpi-card__icon" aria-hidden="true"></i>
    </div>
    <pv-skeleton v-if="loading" width="5rem" height="2rem"/>
    <strong v-else class="kpi-card__value">{{ value }}</strong>
    <span v-if="caption" class="kpi-card__caption" :class="`kpi-card__caption--${tone}`">{{ caption }}</span>
  </article>
</template>

<style scoped>
.kpi-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: var(--shadow-sm);
}

.kpi-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-card__label {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.kpi-card__icon {
  color: var(--color-accent);
}

.kpi-card__value {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  color: var(--color-primary-dark);
  line-height: 1.2;
}

.kpi-card__caption {
  font-size: 0.8rem;
  font-weight: 500;
}

.kpi-card__caption--neutral {
  color: var(--color-text-muted);
}

.kpi-card__caption--success {
  color: var(--color-success);
}

.kpi-card__caption--warn {
  color: var(--color-warn);
}

.kpi-card__caption--danger {
  color: var(--color-danger);
}
</style>
