<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useIamStore } from '@/iam/application/iam.store.js';
import { SignInCommand } from '@/iam/domain/model/sign-in.command.js';
import AuthenticationSection from '@/iam/presentation/components/authentication-section.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

const form = reactive({ email: '', password: '' });
const submitted = ref(false);

const emailError = computed(() => {
  if (!submitted.value) return '';
  if (!form.email.trim()) return t('validation.required');
  return form.email.includes('@') ? '' : t('validation.email');
});
const passwordError = computed(() => submitted.value && !form.password ? t('validation.required') : '');
const sessionExpired = computed(() => route.query.expired === '1');
const signInError = computed(() => iamStore.errors.length > 0 ? String(iamStore.errors[0]) : '');

/** Only paths inside the application are accepted as the page to return to. */
const redirectPath = () => {
  const redirect = String(route.query.redirect ?? '');
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
};

const onSubmit = async () => {
  submitted.value = true;
  if (emailError.value || passwordError.value) return;
  if (await iamStore.signIn(new SignInCommand(form))) await router.replace(redirectPath());
};

onMounted(() => iamStore.errors.splice(0));
</script>

<template>
  <authentication-section :title="t('iam.sign-in.title')" :subtitle="t('iam.sign-in.subtitle')">
    <pv-message v-if="sessionExpired && !signInError" severity="info" :closable="false">
      {{ t('iam.sign-in.session-expired') }}
    </pv-message>
    <pv-message v-if="signInError" severity="error" :closable="false" role="alert">{{ signInError }}</pv-message>

    <form class="flex flex-column gap-3" novalidate @submit.prevent="onSubmit">
      <div class="flex flex-column gap-1">
        <label for="sign-in-email">{{ t('iam.fields.email') }}</label>
        <pv-input-text id="sign-in-email" v-model="form.email" type="email" autocomplete="email"
                       :invalid="!!emailError" :aria-invalid="!!emailError"
                       aria-describedby="sign-in-email-error" fluid/>
        <small id="sign-in-email-error" class="field-error" aria-live="polite">{{ emailError }}</small>
      </div>
      <div class="flex flex-column gap-1">
        <label for="sign-in-password">{{ t('iam.fields.password') }}</label>
        <pv-password input-id="sign-in-password" v-model="form.password" :feedback="false" toggle-mask
                     autocomplete="current-password" :invalid="!!passwordError"
                     :input-props="{ 'aria-invalid': !!passwordError, 'aria-describedby': 'sign-in-password-error' }"
                     fluid/>
        <small id="sign-in-password-error" class="field-error" aria-live="polite">{{ passwordError }}</small>
      </div>
      <pv-button type="submit" :label="t('iam.sign-in.action')" icon="pi pi-sign-in"
                 :loading="iamStore.isSubmitting"/>
    </form>

    <p class="text-muted text-center">
      {{ t('iam.sign-in.no-account') }}
      <router-link :to="{ name: 'sign-up' }">{{ t('iam.sign-in.go-sign-up') }}</router-link>
    </p>
  </authentication-section>
</template>

<style scoped>
.field-error {
  color: var(--color-danger);
  min-height: 1rem;
}

a {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
