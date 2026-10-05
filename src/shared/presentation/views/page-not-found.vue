<script setup>
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const unavailableRoute = route.path;
</script>

<template>
  <main class="page-not-found">
    <div class="surface-panel page-not-found__panel">
      <img src="/favicon.svg" alt="Destilatech" width="56" height="56"/>
      <span class="page-not-found__code">404</span>
      <h1>{{ t('page-not-found.title') }}</h1>
      <p class="text-muted">{{ t('page-not-found.content', { 'unavailable-route': unavailableRoute }) }}</p>
      <router-link to="/">
        <pv-button icon="pi pi-home" :label="t('page-not-found.go-home')"/>
      </router-link>
    </div>
  </main>
</template>

<style scoped>
.page-not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-02);
}

.page-not-found__panel {
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-02);
}

.page-not-found__code {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
}
</style>
