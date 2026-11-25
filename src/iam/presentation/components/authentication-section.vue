<script setup>
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
});

const { t } = useI18n();
const landingPageUrl = import.meta.env.VITE_LANDING_PAGE_URL;
</script>

<template>
  <main class="authentication">
    <div class="authentication__top">
      <a v-if="landingPageUrl" :href="landingPageUrl" class="authentication__brand">
        <img src="/favicon.svg" alt="" width="36" height="36"/>
        <span>Destilatech</span>
      </a>
      <language-switcher/>
    </div>
    <section class="surface-panel authentication__panel" aria-labelledby="authentication-title">
      <h1 id="authentication-title">{{ title }}</h1>
      <p v-if="subtitle" class="text-muted authentication__subtitle">{{ subtitle }}</p>
      <slot/>
    </section>
    <p class="authentication__legal text-muted">
      <a v-if="landingPageUrl" :href="`${landingPageUrl}terms.html`" target="_blank" rel="noopener">
        {{ t('shared.footer.terms') }}
      </a>
    </p>
  </main>
</template>

<style scoped>
.authentication {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-03);
  padding: var(--spacing-03) var(--spacing-02);
}

.authentication__top {
  width: 100%;
  max-width: 30rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-02);
}

.authentication__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-primary-dark);
  text-decoration: none;
}

.authentication__panel {
  width: 100%;
  max-width: 30rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
}

.authentication__subtitle {
  margin-top: -0.5rem;
}

.authentication__legal {
  font-size: 0.85rem;
}

.authentication__legal a {
  color: var(--color-primary);
}
</style>
