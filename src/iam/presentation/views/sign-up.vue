<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '@/iam/application/iam.store.js';
import { MIN_PASSWORD_LENGTH, SignUpCommand } from '@/iam/domain/model/sign-up.command.js';
import { BusinessType } from '@/iam/domain/model/business-type.js';
import { TRIAL_DURATION_DAYS } from '@/iam/domain/model/trial-period.entity.js';
import AuthenticationPanel from '@/iam/presentation/components/authentication-panel.vue';


const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const iamStore = useIamStore();


const PLAN_CODES_BY_SLUG = Object.freeze({
  basico: 'BASIC',
  profesional: 'PROFESSIONAL',
  empresarial: 'ENTERPRISE',
  basic: 'BASIC',
  professional: 'PROFESSIONAL',
  enterprise: 'ENTERPRISE'
});

const preferredPlanCode = computed(() => PLAN_CODES_BY_SLUG[String(route.query.plan || '').toLowerCase()] ?? null);

const form = reactive({
  fullName: '',
  businessName: '',
  email: '',
  password: '',
  businessType: BusinessType.PRODUCER
});
const submitted = ref(false);
const errorMessage = ref('');

const businessTypeOptions = computed(() => [
  { value: BusinessType.PRODUCER, label: t('iam.business-type.PRODUCER'), description: t('iam.business-type.PRODUCER-description'), icon: 'pi pi-building' },
  { value: BusinessType.RETAILER, label: t('iam.business-type.RETAILER'), description: t('iam.business-type.RETAILER-description'), icon: 'pi pi-shop' }
]);

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()));
const isPasswordValid = computed(() => form.password.length >= MIN_PASSWORD_LENGTH);
const isFormValid = computed(() =>
    form.fullName.trim() && form.businessName.trim() && isEmailValid.value && isPasswordValid.value);


const KNOWN_ERRORS = ['email-already-in-use', 'server-unreachable'];
const toErrorMessage = error => KNOWN_ERRORS.includes(error)
    ? t(`iam.errors.${error}`)
    : t('iam.errors.unexpected', { detail: error });

const onSubmit = async () => {
  submitted.value = true;
  errorMessage.value = '';
  if (!isFormValid.value) return;

  const command = new SignUpCommand({ ...form, preferredPlanCode: preferredPlanCode.value });
  const registered = await iamStore.signUp(command);
  if (!registered) {
    errorMessage.value = toErrorMessage(iamStore.errors[0]);
    return;
  }
  toast.add({
    severity: 'success',
    summary: t('iam.sign-up.success-title'),
    detail: t('iam.sign-up.success-detail', { days: TRIAL_DURATION_DAYS }),
    life: 5000
  });
  await router.push('/dashboard');
};
</script>

<template>
  <authentication-panel>
    <form class="sign-up-form" novalidate @submit.prevent="onSubmit">
      <header>
        <h2 class="sign-up-form__title">{{ t('iam.sign-up.title') }}</h2>
        <p class="text-muted">{{ t('iam.sign-up.subtitle', { days: TRIAL_DURATION_DAYS }) }}</p>
      </header>

      <pv-message v-if="preferredPlanCode" severity="info" :closable="false">
        {{ t('iam.sign-up.selected-plan', { plan: t(`billing.plans.${preferredPlanCode}.name`) }) }}
      </pv-message>
      <pv-message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</pv-message>

      <fieldset class="sign-up-form__business-type">
        <legend>{{ t('iam.fields.business-type') }}</legend>
        <button v-for="option in businessTypeOptions" :key="option.value" type="button"
                class="business-type-option"
                :class="{ 'business-type-option--selected': form.businessType === option.value }"
                :aria-pressed="form.businessType === option.value"
                @click="form.businessType = option.value">
          <i :class="option.icon" aria-hidden="true"></i>
          <span class="business-type-option__label">{{ option.label }}</span>
          <span class="business-type-option__description">{{ option.description }}</span>
        </button>
      </fieldset>

      <div class="sign-up-form__row">
        <div class="form-field">
          <label for="sign-up-full-name">{{ t('iam.fields.full-name') }}</label>
          <pv-input-text id="sign-up-full-name" v-model="form.fullName" autocomplete="name"
                         :invalid="submitted && !form.fullName.trim()" fluid/>
          <small v-if="submitted && !form.fullName.trim()" class="form-error">{{ t('validation.required') }}</small>
        </div>
        <div class="form-field">
          <label for="sign-up-business-name">{{ t('iam.fields.business-name') }}</label>
          <pv-input-text id="sign-up-business-name" v-model="form.businessName" autocomplete="organization"
                         :invalid="submitted && !form.businessName.trim()" fluid/>
          <small v-if="submitted && !form.businessName.trim()" class="form-error">{{ t('validation.required') }}</small>
        </div>
      </div>

      <div class="form-field">
        <label for="sign-up-email">{{ t('iam.fields.email') }}</label>
        <pv-input-text id="sign-up-email" v-model="form.email" type="email" autocomplete="email"
                       :invalid="submitted && !isEmailValid" fluid/>
        <small v-if="submitted && !isEmailValid" class="form-error">{{ t('validation.email') }}</small>
      </div>

      <div class="form-field">
        <label for="sign-up-password">{{ t('iam.fields.password') }}</label>
        <pv-password input-id="sign-up-password" v-model="form.password" toggle-mask autocomplete="new-password"
                     :prompt-label="t('iam.password.prompt')" :weak-label="t('iam.password.weak')"
                     :medium-label="t('iam.password.medium')" :strong-label="t('iam.password.strong')"
                     :invalid="submitted && !isPasswordValid" fluid/>
        <small v-if="submitted && !isPasswordValid" class="form-error">
          {{ t('validation.min-length', { length: MIN_PASSWORD_LENGTH }) }}
        </small>
      </div>

      <pv-button type="submit" :label="t('iam.sign-up.submit', { days: TRIAL_DURATION_DAYS })"
                 :loading="iamStore.loading" fluid/>

      <p class="sign-up-form__switch">
        {{ t('iam.sign-up.have-account') }}
        <router-link :to="{ name: 'sign-in' }" class="font-semibold">{{ t('iam.sign-up.sign-in') }}</router-link>
      </p>
    </form>
  </authentication-panel>
</template>

<style scoped>
.sign-up-form {
  width: 100%;
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
}

.sign-up-form__title {
  font-size: 1.8rem;
  margin-bottom: 0.35rem;
}

.sign-up-form__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--spacing-02);
}

.sign-up-form__business-type {
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
}

.sign-up-form__business-type legend {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
}

.business-type-option {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.75rem;
  align-items: center;
  text-align: left;
  padding: 0.85rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.business-type-option i {
  grid-row: span 2;
  font-size: 1.3rem;
  color: var(--color-primary);
}

.business-type-option__label {
  font-weight: 600;
  color: var(--color-primary-dark);
}

.business-type-option__description {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.business-type-option--selected {
  border-color: var(--color-primary);
  background: #fbf5f2;
}

.business-type-option:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.sign-up-form__switch {
  text-align: center;
  color: var(--color-text-muted);
}

.sign-up-form__switch a {
  color: var(--color-primary);
}
</style>
