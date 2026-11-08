<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plan } from '@/billing/domain/model/plan.entity.js';
import { Payment } from '@/billing/domain/model/payment.entity.js';


const props = defineProps({
  visible: { type: Boolean, default: false },
  plan: { type: Plan, default: null },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t, locale } = useI18n();

const TEST_CARD_NUMBER = '4242 4242 4242 4242';

const emptyForm = () => ({ cardholderName: '', cardNumber: '', expiry: '', cvc: '' });
const form = reactive(emptyForm());
const submitted = ref(false);

const cardDigits = computed(() => form.cardNumber.replace(/\D/g, ''));
const cardBrand = computed(() => cardDigits.value ? Payment.detectCardBrand(cardDigits.value) : '');

const isCardholderValid = computed(() => form.cardholderName.trim().length >= 3);
const isCardNumberValid = computed(() => Payment.isValidCardNumber(cardDigits.value));
const isExpiryValid = computed(() => {
  const match = /^(\d{2})\/(\d{2})$/.exec(form.expiry.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
});
const isCvcValid = computed(() => /^\d{3,4}$/.test(form.cvc.trim()));
const isFormValid = computed(() => isCardholderValid.value && isCardNumberValid.value && isExpiryValid.value && isCvcValid.value);

watch(() => props.visible, visible => {
  if (!visible) return;
  submitted.value = false;
  Object.assign(form, emptyForm());
});

const onCardNumberInput = () => {
  form.cardNumber = cardDigits.value.slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
};

const onExpiryInput = () => {
  const digits = form.expiry.replace(/\D/g, '').slice(0, 4);
  form.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const useTestCard = () => {
  form.cardNumber = TEST_CARD_NUMBER;
};

const onSubmit = () => {
  submitted.value = true;
  if (!isFormValid.value) return;
  emit('save', { cardNumber: cardDigits.value });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :style="{ width: '30rem' }" :breakpoints="{ '640px': '95vw' }"
             :header="t('billing.payment-form.title')" @update:visible="emit('update:visible', $event)">
    <div v-if="props.plan" class="payment-summary">
      <span>{{ t(`billing.plans.${props.plan.code}.name`) }}</span>
      <strong>{{ props.plan.price.format(locale) }}<small>/{{ t('billing.per-month') }}</small></strong>
    </div>

    <pv-message severity="info" :closable="false" class="mb-3">
      {{ t('billing.payment-form.simulated-notice') }}
      <pv-button :label="t('billing.payment-form.use-test-card')" link size="small" class="p-0 ml-1"
                 @click="useTestCard"/>
    </pv-message>

    <form id="payment-form" class="grid" novalidate @submit.prevent="onSubmit">
      <div class="col-12 form-field">
        <label for="payment-cardholder">{{ t('billing.payment-form.cardholder') }}</label>
        <pv-input-text id="payment-cardholder" v-model="form.cardholderName" autocomplete="off"
                       :invalid="submitted && !isCardholderValid" fluid/>
        <small v-if="submitted && !isCardholderValid" class="form-error">{{ t('validation.required') }}</small>
      </div>
      <div class="col-12 form-field">
        <label for="payment-card-number">{{ t('billing.payment-form.card-number') }}</label>
        <pv-icon-field>
          <pv-input-text id="payment-card-number" v-model="form.cardNumber" inputmode="numeric" autocomplete="off"
                         placeholder="0000 0000 0000 0000" :invalid="submitted && !isCardNumberValid" fluid
                         @input="onCardNumberInput"/>
          <pv-input-icon v-if="cardBrand" class="payment-brand">{{ cardBrand.toUpperCase() }}</pv-input-icon>
        </pv-icon-field>
        <small v-if="submitted && !isCardNumberValid" class="form-error">{{ t('billing.payment-form.invalid-card') }}</small>
      </div>
      <div class="col-6 form-field">
        <label for="payment-expiry">{{ t('billing.payment-form.expiry') }}</label>
        <pv-input-text id="payment-expiry" v-model="form.expiry" inputmode="numeric" autocomplete="off"
                       placeholder="MM/YY" :invalid="submitted && !isExpiryValid" fluid @input="onExpiryInput"/>
        <small v-if="submitted && !isExpiryValid" class="form-error">{{ t('billing.payment-form.invalid-expiry') }}</small>
      </div>
      <div class="col-6 form-field">
        <label for="payment-cvc">{{ t('billing.payment-form.cvc') }}</label>
        <pv-input-text id="payment-cvc" v-model="form.cvc" inputmode="numeric" autocomplete="off" maxlength="4"
                       placeholder="123" :invalid="submitted && !isCvcValid" fluid/>
        <small v-if="submitted && !isCvcValid" class="form-error">{{ t('billing.payment-form.invalid-cvc') }}</small>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="payment-form" icon="pi pi-lock" :loading="props.saving"
                 :label="props.plan ? t('billing.payment-form.pay', { amount: props.plan.price.format(locale) }) : t('billing.subscribe')"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.payment-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-02);
  background: var(--color-bg-alt);
  border-radius: var(--radius-sm);
  padding: var(--spacing-02);
  margin-bottom: var(--spacing-02);
  font-family: var(--font-heading);
}

.payment-summary strong {
  font-size: 1.4rem;
  color: var(--color-primary);
}

.payment-summary small {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.payment-brand {
  font-size: 0.7rem;
  font-weight: 700;
  font-style: normal;
  color: var(--color-primary);
}
</style>
