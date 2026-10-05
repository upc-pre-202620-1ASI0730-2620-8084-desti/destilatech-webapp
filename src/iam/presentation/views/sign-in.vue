<script setup>
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useIamStore } from '@/iam/application/iam.store.js';
import { SignInCommand } from '@/iam/domain/model/sign-in.command.js';
import AuthenticationPanel from '@/iam/presentation/components/authentication-panel.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const iamStore = useIamStore();

const form = reactive({ email: '', password: '' });
const submitted = ref(false);
const errorMessage = ref('');


const KNOWN_ERRORS = ['invalid-credentials', 'server-unreachable'];
const toErrorMessage = error => KNOWN_ERRORS.includes(error)
    ? t(`iam.errors.${error}`)
    : t('iam.errors.unexpected', { detail: error });

const onSubmit = async () => {
  submitted.value = true;
  errorMessage.value = '';
  if (!form.email || !form.password) return;

  const signedIn = await iamStore.signIn(new SignInCommand(form));
  if (!signedIn) {
    errorMessage.value = toErrorMessage(iamStore.errors[0]);
    return;
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
  await router.push(redirect);
};
</script>

<template>
  <authentication-panel>
    <form class="sign-in-form" novalidate @submit.prevent="onSubmit">
      <header>
        <h2 class="sign-in-form__title">{{ t('iam.sign-in.title') }}</h2>
        <p class="text-muted">{{ t('iam.sign-in.subtitle') }}</p>
      </header>

      <pv-message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</pv-message>

      <div class="form-field">
        <label for="sign-in-email">{{ t('iam.fields.email') }}</label>
        <pv-input-text id="sign-in-email" v-model="form.email" type="email" autocomplete="email"
                       :invalid="submitted && !form.email" fluid/>
        <small v-if="submitted && !form.email" class="form-error">{{ t('validation.required') }}</small>
      </div>

      <div class="form-field">
        <label for="sign-in-password">{{ t('iam.fields.password') }}</label>
        <pv-password input-id="sign-in-password" v-model="form.password" :feedback="false" toggle-mask
                     autocomplete="current-password" :invalid="submitted && !form.password" fluid/>
        <small v-if="submitted && !form.password" class="form-error">{{ t('validation.required') }}</small>
      </div>

      <pv-button type="submit" :label="t('iam.sign-in.submit')" :loading="iamStore.loading" fluid/>

      <p class="sign-in-form__switch">
        {{ t('iam.sign-in.no-account') }}
        <router-link :to="{ name: 'sign-up' }" class="font-semibold">{{ t('iam.sign-in.create-account') }}</router-link>
      </p>
    </form>
  </authentication-panel>
</template>

<style scoped>
.sign-in-form {
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-03);
}

.sign-in-form__title {
  font-size: 1.8rem;
  margin-bottom: 0.35rem;
}

.sign-in-form__switch {
  text-align: center;
  color: var(--color-text-muted);
}

.sign-in-form__switch a {
  color: var(--color-primary);
}
</style>
