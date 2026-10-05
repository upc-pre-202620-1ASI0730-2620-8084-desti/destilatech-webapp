<script setup>
import { useI18n } from 'vue-i18n';
import { watch } from 'vue';
import { STORAGE_KEYS } from '@/shared/infrastructure/base-api.js';

const { locale, availableLocales, t } = useI18n();

watch(locale, newLocale => {
  localStorage.setItem(STORAGE_KEYS.locale, newLocale);
  document.documentElement.lang = newLocale;
});
</script>

<template>
  <pv-select-button v-model="locale" :options="availableLocales" :allow-empty="false"
                    :aria-label="t('shared.language-switcher')" size="small">
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>
