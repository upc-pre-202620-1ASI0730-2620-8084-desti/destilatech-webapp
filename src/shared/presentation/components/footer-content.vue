<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const landingPageUrl = import.meta.env.VITE_LANDING_PAGE_URL;
const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="footer-content">
    <span>&copy; {{ currentYear }} Destilatech · FuturosSeniors. {{ t('shared.footer.rights') }}</span>
    <a v-if="landingPageUrl" :href="landingPageUrl" target="_blank" rel="noopener">{{ t('shared.footer.website') }}</a>
  </div>
</template>

<style scoped>
.footer-content {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-02);
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  padding: var(--spacing-02) var(--spacing-03);
  border-top: 1px solid var(--color-border);
}

.footer-content a {
  color: var(--color-primary);
  font-weight: 500;
}
</style>
