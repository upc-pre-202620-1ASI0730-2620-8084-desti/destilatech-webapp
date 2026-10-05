<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <section class="flex justify-content-center pt-6">
    <div class="surface-panel flex flex-column align-items-center text-center gap-3" style="max-width: 30rem">
      <i class="pi pi-info-circle cancelled-icon" aria-hidden="true"></i>
      <h1>{{ t('billing.checkout.cancelled-title') }}</h1>
      <p class="text-muted">{{ t('billing.checkout.cancelled-detail') }}</p>
      <router-link :to="{ name: 'subscription-plans' }">
        <pv-button icon="pi pi-arrow-left" :label="t('billing.checkout.back-to-plans')"/>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.cancelled-icon {
  font-size: 3rem;
  color: var(--color-warn);
}
</style>
