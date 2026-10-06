<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/shared/application/user.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import LanguageSwitcher from './language-switcher.vue';
import UserSwitcher from './user-switcher.vue';

const emit = defineEmits(['toggle-navigation']);
const { t } = useI18n();
const userStore = useUserStore();
const alertsStore = useAlertsStore();

const pendingAlerts = computed(() => alertsStore.pendingCount);
</script>

<template>
  <header class="top-bar">
    <div class="flex align-items-center gap-2">
      <pv-button class="top-bar__menu-toggle" icon="pi pi-bars" text rounded
                 :aria-label="t('navigation.toggle')" @click="emit('toggle-navigation')"/>
      <div class="top-bar__business">
        <span class="top-bar__business-name">{{ userStore.currentUser?.businessName }}</span>
        <pv-tag v-if="userStore.currentUser" :value="t(`shared.business-type.${userStore.currentUser.businessType}`)"
                class="top-bar__role"/>
      </div>
    </div>
    <div class="flex align-items-center gap-3">
      <router-link :to="{ name: 'alerts-inbox' }" class="top-bar__alerts"
                   :aria-label="t('alerts.pending-count', { count: pendingAlerts })"
                   v-tooltip.bottom="t('alerts.pending-count', { count: pendingAlerts })">
        <i class="pi pi-bell" aria-hidden="true"></i>
        <pv-badge v-if="pendingAlerts > 0" :value="pendingAlerts" severity="danger" class="top-bar__alerts-badge"/>
      </router-link>
      <language-switcher/>
      <user-switcher/>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-02);
  padding: 0 var(--spacing-03);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.top-bar__menu-toggle {
  display: none;
}

.top-bar__business {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.top-bar__business-name {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--color-primary-dark);
}

.top-bar__role {
  background: var(--color-bg-alt);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.top-bar__alerts {
  position: relative;
  font-size: 1.2rem;
  color: var(--color-primary);
  display: inline-flex;
  padding: 0.35rem;
}

.top-bar__alerts-badge {
  position: absolute;
  top: -0.3rem;
  right: -0.55rem;
}

@media (max-width: 960px) {
  .top-bar {
    padding: 0 var(--spacing-02);
  }

  .top-bar__menu-toggle {
    display: inline-flex;
  }
}

@media (max-width: 640px) {
  .top-bar__business {
    display: none;
  }
}
</style>
