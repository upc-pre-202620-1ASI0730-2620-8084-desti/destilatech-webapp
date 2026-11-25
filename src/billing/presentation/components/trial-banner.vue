<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/shared/application/user.store.js';


/**
 * Free trial status (US03, US57): days left while the trial lasts, a warning in its last days,
 * and a link to choose a plan when it has ended. Accounts with a paid plan do not see it.
 */
const { t } = useI18n();
const userStore = useUserStore();

const user = computed(() => userStore.currentUser);
const isVisible = computed(() => user.value && !user.value.hasPaidAccess());
const daysRemaining = computed(() => user.value?.trialPeriod.daysRemaining() ?? 0);
const status = computed(() => {
  if (!user.value || user.value.trialPeriod.isExpired()) return 'expired';
  return user.value.trialPeriod.isExpiringSoon() ? 'expiring' : 'active';
});
const message = computed(() => status.value === 'expired'
    ? t('billing.trial-banner.expired')
    : t('billing.trial-banner.message', { days: daysRemaining.value }, daysRemaining.value));
</script>

<template>
  <div v-if="isVisible" class="trial-banner" :class="`trial-banner--${status}`"
       :role="status === 'active' ? 'status' : 'alert'">
    <i :class="status === 'expired' ? 'pi pi-lock' : 'pi pi-clock'" aria-hidden="true"></i>
    <span>{{ message }}</span>
    <router-link :to="{ name: 'subscription-plans' }" class="trial-banner__action">
      {{ status === 'expired' ? t('billing.trial-banner.choose-plan') : t('billing.trial-banner.action') }}
    </router-link>
  </div>
</template>

<style scoped>
.trial-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.65rem var(--spacing-03);
  font-size: 0.9rem;
  border-bottom: 1px solid var(--color-border);
}

.trial-banner--active {
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.trial-banner--expiring {
  background: #fdf1dc;
  color: #7a4f10;
  border-bottom-color: #f0d9ae;
}

.trial-banner--expired {
  background: #fbe4e1;
  color: #8a1f17;
  border-bottom-color: #f2c4bf;
}

.trial-banner__action {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
