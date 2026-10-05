<script setup>
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue';

const { t } = useI18n();
</script>

<template>
  <main class="authentication-panel">
    <section class="authentication-panel__brand" aria-hidden="false">
      <div class="authentication-panel__logo">
        <img src="/favicon.svg" alt="" width="40" height="40"/>
        <span>Destilatech</span>
      </div>
      <div>
        <h1 class="authentication-panel__headline">{{ t('iam.brand.headline') }}</h1>
        <p class="authentication-panel__lead">{{ t('iam.brand.lead') }}</p>
      </div>
      <ul class="authentication-panel__highlights">
        <li><i class="pi pi-wave-pulse" aria-hidden="true"></i>{{ t('iam.brand.highlight-monitoring') }}</li>
        <li><i class="pi pi-box" aria-hidden="true"></i>{{ t('iam.brand.highlight-inventory') }}</li>
        <li><i class="pi pi-chart-line" aria-hidden="true"></i>{{ t('iam.brand.highlight-estimations') }}</li>
      </ul>
    </section>
    <section class="authentication-panel__form">
      <div class="authentication-panel__language">
        <language-switcher/>
      </div>
      <div class="authentication-panel__content">
        <slot/>
      </div>
    </section>
  </main>
</template>

<style scoped>
.authentication-panel {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  background: var(--color-bg);
}

.authentication-panel__brand {
  background: linear-gradient(160deg, var(--color-primary-dark), var(--color-primary));
  color: #fffdf9;
  padding: var(--spacing-05) var(--spacing-04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-04);
}

.authentication-panel__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
}

.authentication-panel__headline {
  color: #fffdf9;
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  margin-bottom: var(--spacing-02);
}

.authentication-panel__lead {
  color: #f5e6df;
  max-width: 28rem;
}

.authentication-panel__highlights {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
  color: #f5e6df;
}

.authentication-panel__highlights i {
  color: var(--color-accent);
  margin-right: 0.6rem;
}

.authentication-panel__form {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-03);
}

.authentication-panel__language {
  display: flex;
  justify-content: flex-end;
}

.authentication-panel__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-03) 0;
}

@media (max-width: 860px) {
  .authentication-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .authentication-panel__brand {
    padding: var(--spacing-03);
  }

  .authentication-panel__highlights {
    display: none;
  }
}
</style>
