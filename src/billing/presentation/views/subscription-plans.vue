<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useBillingStore } from '@/billing/application/billing.store.js';
import { useUserStore } from '@/shared/application/user.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import PlanCard from '@/billing/presentation/components/plan-card.vue';
import PaymentHistory from '@/billing/presentation/components/payment-history.vue';


const { t, locale } = useI18n();
const route = useRoute();
const confirm = useConfirm();
const toast = useToast();
const billingStore = useBillingStore();
const userStore = useUserStore
();

const user = computed(() => userStore.currentUser);
const trialExpired = computed(() => route.query.reason === 'trial-expired' || !userStore.hasActiveAccess);
const activeSubscription = computed(() =>
    billingStore.currentSubscription?.isActive() ? billingStore.currentSubscription : null);

const statusMessage = computed(() => {
  if (!user.value) return '';
  if (activeSubscription.value && billingStore.currentPlan) {
    return t('billing.status.subscribed', {
      plan: t(`billing.plans.${billingStore.currentPlan.code}.name`),
      date: activeSubscription.value.renewalDate.format(locale.value)
    });
  }
  if (!user.value.trialPeriod.isExpired()) {
    return t('billing.status.trial', { days: user.value.trialPeriod.daysRemaining() }, user.value.trialPeriod.daysRemaining());
  }
  return t('billing.status.expired');
});

const redirecting = ref(false);


const onSelectPlan = plan => {
  confirm.require({
    header: t('billing.confirm.header'),
    message: t('billing.confirm.message', {
      plan: t(`billing.plans.${plan.code}.name`),
      price: plan.price.format()
    }),
    icon: 'pi pi-credit-card',
    acceptProps: { label: t('billing.confirm.accept') },
    rejectProps: { label: t('common.cancel'), outlined: true },
    accept: async () => {
      redirecting.value = true;
      const checkoutUrl = await billingStore.startCheckout(plan);
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      redirecting.value = false;
      const error = billingStore.errors[0];
      toast.add({ severity: 'error', summary: t('common.error'), detail: t(`billing.errors.${error}`, String(error)), life: 6000 });
    }
  });
};

const onCancelSubscription = () => {
  confirm.require({
    header: t('billing.cancel.header'),
    message: t('billing.cancel.message'),
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: t('billing.cancel.accept'), severity: 'danger' },
    rejectProps: { label: t('common.back'), outlined: true },
    accept: async () => {
      if (await billingStore.cancelSubscription()) {
        toast.add({ severity: 'info', summary: t('billing.cancel.done'), life: 3000 });
      }
    }
  });
};

onMounted(() => billingStore.fetchBillingOverview());
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('billing.title')" :subtitle="t('billing.subtitle')"/>

    <pv-message v-if="trialExpired && !activeSubscription" severity="warn" :closable="false">
      {{ t('billing.trial-expired-message') }}
    </pv-message>

    <div class="surface-panel flex align-items-center justify-content-between gap-3 flex-wrap">
      <div class="flex align-items-center gap-3">
        <i class="pi pi-credit-card billing-status__icon" aria-hidden="true"></i>
        <div>
          <h2>{{ t('billing.status.title') }}</h2>
          <p class="text-muted">{{ statusMessage }}</p>
        </div>
      </div>
      <pv-button v-if="activeSubscription" :label="t('billing.cancel.action')" severity="danger" text
                 @click="onCancelSubscription"/>
    </div>

    <div v-if="billingStore.loading" class="plans-grid">
      <pv-skeleton v-for="index in 3" :key="index" height="24rem" border-radius="22px"/>
    </div>
    <div v-else class="plans-grid">
      <plan-card v-for="plan in billingStore.plans" :key="plan.id" :plan="plan"
                 :is-current="activeSubscription?.planId === plan.id"
                 :is-preferred="!activeSubscription && user?.preferredPlanCode === plan.code"
                 @select="onSelectPlan"/>
    </div>
    <p class="text-muted text-sm payment-note">
      <i class="pi pi-lock" aria-hidden="true"></i> {{ t('billing.payment-note') }}
    </p>

    <payment-history/>

    <div v-if="redirecting" class="redirect-overlay" role="status">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <span>{{ t('billing.checkout.redirecting') }}</span>
    </div>
  </section>
</template>

<style scoped>
.redirect-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(255, 253, 249, 0.85);
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--color-primary-dark);
}

.payment-note i {
  color: var(--color-success);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--spacing-03);
  padding-top: 0.8rem;
}

.billing-status__icon {
  font-size: 1.6rem;
  color: var(--color-accent);
}
</style>
