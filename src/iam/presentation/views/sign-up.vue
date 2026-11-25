<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useIamStore } from '@/iam/application/iam.store.js';
import { MINIMUM_PASSWORD_LENGTH, PLAN_CODES, SignUpCommand } from '@/iam/domain/model/sign-up.command.js';
import { BusinessType } from '@/shared/domain/model/business-type.js';
import { TRIAL_DURATION_DAYS } from '@/shared/domain/model/trial-period.entity.js';
import AuthenticationSection from '@/iam/presentation/components/authentication-section.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

/** The landing page sends ?type=producer|retailer and ?plan=basic|professional|enterprise. */
const typeFromLanding = String(route.query.type ?? '').toUpperCase();
const planFromLanding = String(route.query.plan ?? '').toUpperCase();

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  businessName: '',
  businessType: Object.values(BusinessType).includes(typeFromLanding) ? typeFromLanding : null,
  preferredPlanCode: PLAN_CODES.includes(planFromLanding) ? planFromLanding : null
});
const submitted = ref(false);

const businessTypeOptions = computed(() => Object.values(BusinessType).map(type => ({
  label: t(`shared.business-type.${type}`),
  value: type
})));

const errors = computed(() => {
  if (!submitted.value) return {};
  return {
    fullName: form.fullName.trim() ? '' : t('validation.required'),
    email: !form.email.trim() ? t('validation.required') : form.email.includes('@') ? '' : t('validation.email'),
    password: form.password.length >= MINIMUM_PASSWORD_LENGTH ? ''
        : t('validation.min-length', { length: MINIMUM_PASSWORD_LENGTH }),
    businessName: form.businessName.trim() ? '' : t('validation.required'),
    businessType: form.businessType ? '' : t('iam.sign-up.choose-business-type')
  };
});
const hasErrors = computed(() => Object.values(errors.value).some(Boolean));
const signUpError = computed(() => iamStore.errors.length > 0 ? String(iamStore.errors[0]) : '');

const onSubmit = async () => {
  submitted.value = true;
  if (hasErrors.value) return;
  if (await iamStore.signUp(new SignUpCommand(form))) await router.replace({ name: 'dashboard' });
};

onMounted(() => iamStore.errors.splice(0));
</script>

<template>
  <authentication-section :title="t('iam.sign-up.title')"
                          :subtitle="t('iam.sign-up.subtitle', { days: TRIAL_DURATION_DAYS })">
    <pv-message v-if="form.preferredPlanCode" severity="info" :closable="false">
      {{ t('iam.sign-up.chosen-plan', { plan: t(`billing.plans.${form.preferredPlanCode}.name`) }) }}
    </pv-message>
    <pv-message v-if="signUpError" severity="error" :closable="false" role="alert">{{ signUpError }}</pv-message>

    <form class="flex flex-column gap-3" novalidate @submit.prevent="onSubmit">
      <fieldset class="flex flex-column gap-1 business-type">
        <legend>{{ t('iam.fields.business-type') }}</legend>
        <pv-select-button v-model="form.businessType" :options="businessTypeOptions" option-label="label"
                          option-value="value" :allow-empty="false" :invalid="!!errors.businessType"
                          :aria-label="t('iam.fields.business-type')"/>
        <small class="field-error" aria-live="polite">{{ errors.businessType }}</small>
      </fieldset>
      <div class="flex flex-column gap-1">
        <label for="sign-up-full-name">{{ t('iam.fields.full-name') }}</label>
        <pv-input-text id="sign-up-full-name" v-model="form.fullName" autocomplete="name"
                       :invalid="!!errors.fullName" :aria-invalid="!!errors.fullName"
                       aria-describedby="sign-up-full-name-error" fluid/>
        <small id="sign-up-full-name-error" class="field-error" aria-live="polite">{{ errors.fullName }}</small>
      </div>
      <div class="flex flex-column gap-1">
        <label for="sign-up-business-name">{{ t('iam.fields.business-name') }}</label>
        <pv-input-text id="sign-up-business-name" v-model="form.businessName" autocomplete="organization"
                       :invalid="!!errors.businessName" :aria-invalid="!!errors.businessName"
                       aria-describedby="sign-up-business-name-error" fluid/>
        <small id="sign-up-business-name-error" class="field-error" aria-live="polite">{{ errors.businessName }}</small>
      </div>
      <div class="flex flex-column gap-1">
        <label for="sign-up-email">{{ t('iam.fields.email') }}</label>
        <pv-input-text id="sign-up-email" v-model="form.email" type="email" autocomplete="email"
                       :invalid="!!errors.email" :aria-invalid="!!errors.email"
                       aria-describedby="sign-up-email-error" fluid/>
        <small id="sign-up-email-error" class="field-error" aria-live="polite">{{ errors.email }}</small>
      </div>
      <div class="flex flex-column gap-1">
        <label for="sign-up-password">{{ t('iam.fields.password') }}</label>
        <pv-password input-id="sign-up-password" v-model="form.password" :feedback="false" toggle-mask
                     autocomplete="new-password" :invalid="!!errors.password"
                     :input-props="{ 'aria-invalid': !!errors.password, 'aria-describedby': 'sign-up-password-hint' }"
                     fluid/>
        <small id="sign-up-password-hint" :class="errors.password ? 'field-error' : 'text-muted'" aria-live="polite">
          {{ errors.password || t('validation.min-length', { length: MINIMUM_PASSWORD_LENGTH }) }}
        </small>
      </div>
      <p class="text-muted terms-notice">
        {{ t('iam.sign-up.terms-notice') }}
      </p>
      <pv-button type="submit" :label="t('iam.sign-up.action', { days: TRIAL_DURATION_DAYS })" icon="pi pi-user-plus"
                 :loading="iamStore.isSubmitting"/>
    </form>

    <p class="text-muted text-center">
      {{ t('iam.sign-up.has-account') }}
      <router-link :to="{ name: 'sign-in' }">{{ t('iam.sign-up.go-sign-in') }}</router-link>
    </p>
  </authentication-section>
</template>

<style scoped>
.field-error {
  color: var(--color-danger);
  min-height: 1rem;
}

.business-type {
  border: 0;
  padding: 0;
  margin: 0;
}

.business-type legend {
  margin-bottom: 0.25rem;
}

.terms-notice {
  font-size: 0.85rem;
}

a {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
