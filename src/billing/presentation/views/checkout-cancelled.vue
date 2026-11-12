<script setup>
import { useI18n } from 'vue-i18n';
import PageHeader from '@/shared/presentation/components/page-header.vue';


const { t } = useI18n();
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('billing.checkout.title')" :subtitle="t('billing.subtitle')"/>

    <div class="surface-panel checkout-result">
      <i class="pi pi-info-circle checkout-result__icon" aria-hidden="true"></i>
      <h2>{{ t('billing.checkout.cancelled-title') }}</h2>
      <p class="text-muted">{{ t('billing.checkout.cancelled-detail') }}</p>
      <router-link :to="{ name: 'subscription-plans' }">
        <pv-button :label="t('billing.checkout.back-to-plans')" icon="pi pi-arrow-left" outlined/>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.checkout-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-02);
  text-align: center;
  padding: 2.5rem 1.5rem;
}

.checkout-result__icon {
  font-size: 3rem;
  color: var(--color-text-muted);
}
</style>
