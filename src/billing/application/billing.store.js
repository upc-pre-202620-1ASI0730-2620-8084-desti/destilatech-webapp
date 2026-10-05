import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { BillingApi } from '@/billing/infrastructure/billing-api.js';
import { PlanAssembler } from '@/billing/infrastructure/plan.assembler.js';
import { SubscriptionAssembler } from '@/billing/infrastructure/subscription.assembler.js';
import { PaymentAssembler } from '@/billing/infrastructure/payment.assembler.js';
import { Payment } from '@/billing/domain/model/payment.entity.js';
import { Subscription } from '@/billing/domain/model/subscription.entity.js';
import { useIamStore } from '@/iam/application/iam.store.js';

const billingApi = new BillingApi();
const planAssembler = new PlanAssembler();
const subscriptionAssembler = new SubscriptionAssembler();
const paymentAssembler = new PaymentAssembler();


export const useBillingStore = defineStore('billing', () => {
    const plans = ref([]);
    const currentSubscription = ref(null);
    const payments = ref([]);
    const errors = ref([]);
    const loading = ref(false);

    const currentPlan = computed(() =>
        currentSubscription.value ? plans.value.find(plan => plan.id === currentSubscription.value.planId) ?? null : null);

    const findPlan = planId => plans.value.find(plan => plan.id === planId) ?? null;

    async function fetchBillingOverview() {
        const iamStore = useIamStore();
        errors.value = [];
        loading.value = true;
        try {
            const [plansResponse, subscriptionsResponse, paymentsResponse] = await Promise.all([
                billingApi.getPlans(),
                billingApi.getSubscriptionsByUserId(iamStore.currentUserId),
                billingApi.getPaymentsByUserId(iamStore.currentUserId)
            ]);
            plans.value = planAssembler.toEntitiesFromResponse(plansResponse);
            currentSubscription.value = subscriptionAssembler.toEntitiesFromResponse(subscriptionsResponse)[0] ?? null;
            payments.value = paymentAssembler.toEntitiesFromResponse(paymentsResponse);
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    async function startCheckout(plan) {
        const iamStore = useIamStore();
        errors.value = [];
        try {
            const origin = window.location.origin;
            const response = await billingApi.createCheckoutSession({
                userId: iamStore.currentUserId,
                planId: plan.id,
                successUrl: `${origin}/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${origin}/billing/checkout/cancelled`
            });
            return response.data.url;
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    async function confirmCheckout(sessionId) {
        const iamStore = useIamStore();
        errors.value = [];
        try {
            const alreadyRegistered = paymentAssembler.toEntitiesFromResponse(await billingApi.getPaymentsByReference(sessionId));
            if (alreadyRegistered.length) {
                await fetchBillingOverview();
                return alreadyRegistered[0];
            }

            const sessionResponse = await billingApi.getCheckoutSession(sessionId);
            const payment = Payment.fromConfirmedCheckout(sessionResponse.data);
            if (payment.userId !== iamStore.currentUserId) throw new Error('payment-not-completed');

            await fetchBillingOverview();
            if (currentSubscription.value?.isActive()) await cancelSubscription();

            const subscription = Subscription.activate(payment.userId, payment.planId, payment.reference);
            await billingApi.createSubscription(subscriptionAssembler.toResourceFromEntity(subscription));
            const paymentResponse = await billingApi.createPayment(paymentAssembler.toResourceFromEntity(payment));
            await iamStore.extendAccountAccess(subscription.renewalDate);
            await fetchBillingOverview();
            return paymentAssembler.toEntityFromResponse(paymentResponse);
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function cancelSubscription() {
        if (!currentSubscription.value) return false;
        errors.value = [];
        try {
            currentSubscription.value.cancel();
            await billingApi.patchSubscription(currentSubscription.value.id, { status: currentSubscription.value.status });
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        }
    }

    return {
        plans,
        currentSubscription,
        currentPlan,
        payments,
        errors,
        loading,
        findPlan,
        fetchBillingOverview,
        startCheckout,
        confirmCheckout,
        cancelSubscription
    };
});
