<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useBillingStore } from '@/billing/application/billing.store.js';

const { t, locale } = useI18n();
const route = useRoute();
const billingStore = useBillingStore();

const status = ref('confirming');
const payment = ref(null);
const errorMessage = ref('');

onMounted(async () => {
  const sessionId = route.query.session_id;
  if (typeof sessionId !== 'string' || !sessionId) {
    status.value = 'error';
    errorMessage.value = t('billing.errors.missing-session');
    return;
  }
  payment.value = await billingStore.confirmCheckout(sessionId);
  if (payment.value) {
    status.value = 'paid';
  } else {
    status.value = 'error';
    const error = billingStore.errors[0];
    errorMessage.value = t(`billing.errors.${error}`, String(error));
  }
});
</script>

<template>
  <section class="checkout-result">
    <div class="surface-panel checkout-result__panel">
      <template v-if="status === 'confirming'">
        <i class="pi pi-spin pi-spinner checkout-result__icon" aria-hidden="true"></i>
        <h1>{{ t('billing.checkout.confirming') }}</h1>
      </template>

      <template v-else-if="status === 'paid'">
        <i class="pi pi-check-circle checkout-result__icon checkout-result__icon--success" aria-hidden="true"></i>
        <h1>{{ t('billing.checkout.success-title') }}</h1>
        <p class="text-muted">
          {{ t('billing.checkout.success-detail', {
          plan: billingStore.currentPlan ? t(`billing.plans.${billingStore.currentPlan.code}.name`) : '',
          date: billingStore.currentSubscription?.renewalDate.format(locale) ?? ''
        }) }}
        </p>
        <dl class="checkout-result__facts">
          <dt>{{ t('billing.payments.amount') }}</dt>
          <dd>{{ payment.amount.format() }}</dd>
          <dt v-if="payment.maskedCard">{{ t('billing.payments.card') }}</dt>
          <dd v-if="payment.maskedCard">{{ payment.maskedCard }}</dd>
          <dt>{{ t('billing.payments.reference') }}</dt>
          <dd class="text-sm">{{ payment.reference }}</dd>
        </dl>
        <router-link to="/dashboard">
          <pv-button icon="pi pi-th-large" :label="t('billing.checkout.go-dashboard')"/>
        </router-link>
      </template>

      <template v-else>
        <i class="pi pi-times-circle checkout-result__icon checkout-result__icon--error" aria-hidden="true"></i>
        <h1>{{ t('billing.checkout.error-title') }}</h1>
        <p class="text-muted">{{ errorMessage }}</p>
        <router-link :to="{ name: 'subscription-plans' }">
          <pv-button icon="pi pi-arrow-left" :label="t('billing.checkout.back-to-plans')" outlined/>
        </router-link>
      </template>
    </div>
  </section>
</template>

<style scoped>
.checkout-result {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-04);
}

.checkout-result__panel {
  max-width: 30rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-02);
}

.checkout-result__icon {
  font-size: 3rem;
  color: var(--color-accent);
}

.checkout-result__icon--success {
  color: var(--color-success);
}

.checkout-result__icon--error {
  color: var(--color-danger);
}

.checkout-result__facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  margin: 0;
  text-align: left;
  width: 100%;
  background: var(--color-bg-alt);
  border-radius: var(--radius-sm);
  padding: var(--spacing-02);
}

.checkout-result__facts dt {
  color: var(--color-text-muted);
}

.checkout-result__facts dd {
  margin: 0;
  font-weight: 600;
  word-break: break-all;
}
</style>
