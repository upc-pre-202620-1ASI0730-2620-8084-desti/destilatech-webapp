<script setup>
import { useI18n } from 'vue-i18n';
import { Plan } from '@/billing/domain/model/plan.entity.js';


const props = defineProps({
  plan: { type: Plan, required: true },
  isCurrent: { type: Boolean, default: false },
  isPreferred: { type: Boolean, default: false }
});
const emit = defineEmits(['select']);
const { t, locale } = useI18n();
</script>

<template>
  <article class="plan-card" :class="{ 'plan-card--featured': props.plan.recommended || props.isPreferred }">
    <span v-if="props.isCurrent" class="plan-card__badge plan-card__badge--current">{{ t('billing.current-plan') }}</span>
    <span v-else-if="props.isPreferred" class="plan-card__badge">{{ t('billing.preferred-plan') }}</span>
    <span v-else-if="props.plan.recommended" class="plan-card__badge">{{ t('billing.recommended') }}</span>

    <h2>{{ t(`billing.plans.${props.plan.code}.name`) }}</h2>
    <p class="plan-card__price">
      {{ props.plan.price.format(locale) }}<span>/{{ t('billing.per-month') }}</span>
    </p>
    <p class="text-muted">{{ t(`billing.plans.${props.plan.code}.description`) }}</p>
    <ul class="plan-card__features">
      <li v-for="featureKey in props.plan.featureKeys" :key="featureKey">
        <i class="pi pi-check" aria-hidden="true"></i>{{ t(featureKey) }}
      </li>
      <li>
        <i class="pi pi-check" aria-hidden="true"></i>
        {{ props.plan.hasUnlimitedUsers() ? t('billing.features.unlimited-users') : t('billing.features.users', { count: props.plan.maxUsers }, props.plan.maxUsers) }}
      </li>
    </ul>
    <pv-button :label="props.isCurrent ? t('billing.active') : t('billing.subscribe')" :disabled="props.isCurrent"
               :outlined="!(props.plan.recommended || props.isPreferred)" fluid @click="emit('select', props.plan)"/>
  </article>
</template>

<style scoped>
.plan-card {
  position: relative;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-04) var(--spacing-03) var(--spacing-03);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
  box-shadow: var(--shadow-sm);
}

.plan-card--featured {
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-md);
}

.plan-card__badge {
  position: absolute;
  top: -0.8rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: var(--color-primary-dark);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.2rem 0.9rem;
  white-space: nowrap;
}

.plan-card__badge--current {
  background: var(--color-success);
  color: #fffdf9;
}

.plan-card__price {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.plan-card__price span {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.plan-card__features {
  list-style: none;
  padding: 0;
  margin: 0 0 auto;
  display: grid;
  gap: 0.5rem;
}

.plan-card__features i {
  color: var(--color-success);
  margin-right: 0.5rem;
}
</style>
