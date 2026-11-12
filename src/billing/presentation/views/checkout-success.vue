<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useBillingStore } from '@/billing/application/billing.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';


const { t, locale } = useI18n();
const route = useRoute();
const billingStore = useBillingStore();

const status = ref('confirming');
const payment = ref(null);
const errorMessage = ref('');

const plan = computed(() => payment.value ? billingStore.findPlan(payment.value.planId) : null);


onMounted(async () => {
  const sessionId = route.query.session_id;
  if (!sessionId) {
    status.value = 'failed';
    errorMessage.value = t('billing.checkout.missing-session');
    return;
  }
  payment.value = await billingStore.confirmCheckout(String(sessionId));
  if (payment.value) {
    status.value = 'paid';
    return;
  }
  status.value = 'failed';
  errorMessage.value = String(billingStore.errors[0] ?? '');
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('billing.checkout.title')" :subtitle="t('billing.subtitle')"/>

    <div class="surface-panel checkout-result">
      <template v-if="status === 'confirming'">
        <pv-progress-bar mode="indeterminate" class="checkout-result__progress" aria-hidden="true"/>
        <p>{{ t('billing.checkout.confirming') }}</p>
      </template>

      <template v-else-if="status === 'paid'">
        <i class="pi pi-check-circle checkout-result__icon checkout-result__icon--success" aria-hidden="true"></i>
        <h2>{{ t('billing.checkout.success-title') }}</h2>
        <p v-if="plan && billingStore.currentSubscription">
          {{ t('billing.checkout.success-detail', {
            plan: t(`billing.plans.${plan.code}.name`),
            date: billingStore.currentSubscription.renewalDate.format(locale)
          }) }}
        </p>
        <p class="text-muted text-sm">
          {{ payment.amount.format(locale) }}<template v-if="payment.maskedCard"> · {{ payment.maskedCard }}</template>
        </p>
        <router-link :to="{ name: 'dashboard' }">
          <pv-button :label="t('billing.checkout.go-dashboard')" icon="pi pi-home"/>
        </router-link>
      </template>

      <template v-else>
        <i class="pi pi-times-circle checkout-result__icon checkout-result__icon--error" aria-hidden="true"></i>
        <h2>{{ t('billing.checkout.failed-title') }}</h2>
        <p class="text-muted">{{ errorMessage }}</p>
        <router-link :to="{ name: 'subscription-plans' }">
          <pv-button :label="t('billing.checkout.back-to-plans')" icon="pi pi-arrow-left" outlined/>
        </router-link>
      </template>
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
}

.checkout-result__progress {
  width: 12rem;
  height: 6px;
}

.checkout-result__icon--success {
  color: var(--color-success);
}

.checkout-result__icon--error {
  color: var(--color-danger);
}
</style>
