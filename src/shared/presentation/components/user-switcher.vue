<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/shared/application/user.store.js';

const { t } = useI18n();
const userStore = useUserStore();

const options = computed(() => userStore.users.map(user => ({
  label: t(`shared.business-type.${user.businessType}`),
  value: user.id
})));

const changeUser = userId => {
  if (!userId || userId === userStore.currentUserId) return;
  userStore.selectUser(userId);
  window.location.assign('/dashboard');
};
</script>

<template>
  <pv-select-button :model-value="userStore.currentUserId" :options="options" option-label="label"
                    option-value="value" :allow-empty="false" :aria-label="t('shared.user-switcher.label')"
                    @update:model-value="changeUser"/>
</template>
