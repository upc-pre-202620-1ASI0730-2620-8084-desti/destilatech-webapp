<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useIamStore } from '@/iam/application/iam.store.js';


const { t } = useI18n();
const iamStore = useIamStore();

const user = computed(() => iamStore.currentUser);
const isVisible = computed(() => user.value && !user.value.hasPaidAccess() && user.value.trialPeriod.isExpiringSoon());
const daysRemaining = computed(() => user.value?.trialPeriod.daysRemaining() ?? 0);
</script>

<template>
  <div v-if="isVisible" class="trial-banner" role="status">
    <i class="pi pi-clock" aria-hidden="true"></i>
    <span>{{ t('billing.trial-banner.message', { days: daysRemaining }, daysRemaining) }}</span>
    <router-link :to="{ name: 'subscription-plans' }" class="trial-banner__action">
      {{ t('billing.trial-banner.action') }}
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
  background: #fdf1dc;
  color: #7a4f10;
  border-bottom: 1px solid #f0d9ae;
  font-size: 0.9rem;
}

.trial-banner__action {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
