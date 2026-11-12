import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { BillingApi } from '@/billing/infrastructure/billing-api.js';
import { PlanAssembler } from '@/billing/infrastructure/plan.assembler.js';
import { SubscriptionAssembler } from '@/billing/infrastructure/subscription.assembler.js';
import { PaymentAssembler } from '@/billing/infrastructure/payment.assembler.js';
import { useUserStore } from '@/shared/application/user.store.js';

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
        const userStore = useUserStore();
        errors.value = [];
        loading.value = true;
        try {
            const [plansResponse, subscriptionsResponse, paymentsResponse] = await Promise.all([
                billingApi.getPlans(),
                billingApi.getSubscriptionsByUserId(userStore.currentUserId),
                billingApi.getPaymentsByUserId(userStore.currentUserId)
            ]);
            plans.value = planAssembler.toEntitiesFromResponse(plansResponse);
            const subscriptions = subscriptionAssembler.toEntitiesFromResponse(subscriptionsResponse)
                .sort((first, second) => second.startDate.toDate() - first.startDate.toDate());
            currentSubscription.value = subscriptions.find(subscription => subscription.isActive()) ?? subscriptions[0] ?? null;
            payments.value = paymentAssembler.toEntitiesFromResponse(paymentsResponse)
                .sort((first, second) => second.paidAt.toDate() - first.paidAt.toDate());
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    /**
     * Starts the payment of a plan: asks the platform for a Stripe Checkout session.
     * @returns {Promise<string|null>} URL of the Stripe page, or null when it fails.
     */
    async function startCheckout(plan) {
        const userStore = useUserStore();
        errors.value = [];
        try {
            const response = await billingApi.createCheckoutSession(userStore.currentUserId, plan.id);
            return response.data.url;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    /**
     * Confirms the paid Stripe session when the user comes back from Stripe. The platform registers the payment,
     * activates the subscription and extends the access of the user.
     * @returns {Promise<import('@/billing/domain/model/payment.entity.js').Payment|null>}
     */
    async function confirmCheckout(sessionId) {
        const userStore = useUserStore();
        errors.value = [];
        try {
            const response = await billingApi.confirmCheckoutSession(sessionId);
            const payment = paymentAssembler.toEntityFromResource(response.data.payment);
            await Promise.all([userStore.refreshCurrentUser(), fetchBillingOverview()]);
            return payment;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function cancelSubscription() {
        if (!currentSubscription.value) return false;
        errors.value = [];
        try {
            const response = await billingApi.cancelSubscription(currentSubscription.value.id);
            currentSubscription.value = subscriptionAssembler.toEntityFromResponse(response);
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
