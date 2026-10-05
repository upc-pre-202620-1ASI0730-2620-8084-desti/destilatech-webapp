<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useIamStore } from '@/iam/application/iam.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import SideNavigation from './side-navigation.vue';
import TopBar from './top-bar.vue';
import FooterContent from './footer-content.vue';
import TrialBanner from '@/billing/presentation/components/trial-banner.vue';

const route = useRoute();
const iamStore = useIamStore();
const alertsStore = useAlertsStore();
const drawerVisible = ref(false);

const toggleNavigation = () => {
  drawerVisible.value = !drawerVisible.value;
};

watch(() => route.fullPath, () => {
  drawerVisible.value = false;
});

onMounted(() => {
  if (iamStore.isSignedIn) alertsStore.fetchAlerts();
});
</script>

<template>
  <div class="layout">
    <aside class="layout__sidebar">
      <side-navigation/>
    </aside>
    <pv-drawer v-model:visible="drawerVisible" class="layout__drawer" :show-close-icon="false"
               :pt="{ content: { style: 'padding: 0' } }">
      <side-navigation @navigate="drawerVisible = false"/>
    </pv-drawer>

    <div class="layout__main">
      <top-bar @toggle-navigation="toggleNavigation"/>
      <trial-banner/>
      <main class="layout__content">
        <router-view/>
      </main>
      <footer>
        <footer-content/>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.layout__sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.layout__content {
  flex: 1;
  padding: var(--spacing-03);
  width: 100%;
  max-width: 88rem;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .layout__sidebar {
    display: none;
  }

  .layout__content {
    padding: var(--spacing-02);
  }
}
</style>

<style>
.layout__drawer.p-drawer {
  width: var(--sidebar-width);
  background: var(--color-primary-dark);
  border: 0;
}

.layout__drawer .p-drawer-header {
  display: none;
}
</style>
