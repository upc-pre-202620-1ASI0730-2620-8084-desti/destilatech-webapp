<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/shared/application/user.store.js';
import { BusinessType } from '@/shared/domain/model/business-type.js';

const emit = defineEmits(['navigate']);
const { t } = useI18n();
const userStore = useUserStore();
const route = useRoute();

const { PRODUCER, RETAILER } = BusinessType;


const navigationSections = [
  {
    section: 'navigation.sections.overview',
    items: [
      { label: 'navigation.dashboard', icon: 'pi pi-th-large', to: '/dashboard', businessTypes: [PRODUCER, RETAILER] }
    ]
  },
  {
    section: 'navigation.sections.production',
    items: [
      { label: 'navigation.monitoring', icon: 'pi pi-wave-pulse', to: '/production/monitoring', businessTypes: [PRODUCER] },
      { label: 'navigation.batches', icon: 'pi pi-objects-column', to: '/production/batches', businessTypes: [PRODUCER] }
    ]
  },
  {
    section: 'navigation.sections.operations',
    items: [
      { label: 'navigation.inventory', icon: 'pi pi-box', to: '/inventory', businessTypes: [PRODUCER, RETAILER] },
      { label: 'navigation.orders', icon: 'pi pi-shopping-cart', to: '/orders', businessTypes: [PRODUCER, RETAILER] },
      { label: 'navigation.customers', icon: 'pi pi-users', to: '/orders/customers', businessTypes: [PRODUCER, RETAILER] },
      { label: 'navigation.replenishment', icon: 'pi pi-truck', to: '/orders/replenishment', businessTypes: [PRODUCER, RETAILER] },
      { label: 'navigation.alerts', icon: 'pi pi-bell', to: '/alerts', businessTypes: [PRODUCER, RETAILER] }
    ]
  },
  {
    section: 'navigation.sections.analytics',
    items: [
      { label: 'navigation.indicators', icon: 'pi pi-chart-line', to: '/analytics/indicators', businessTypes: [PRODUCER, RETAILER] }
    ]
  },
  {
    section: 'navigation.sections.account',
    items: [
      { label: 'navigation.subscription', icon: 'pi pi-credit-card', to: '/billing/plans', businessTypes: [PRODUCER, RETAILER] }
    ]
  }
];

const visibleSections = computed(() => {
  const businessType = userStore.currentUser?.businessType;
  return navigationSections
      .map(section => ({ ...section, items: section.items.filter(item => item.businessTypes.includes(businessType)) }))
      .filter(section => section.items.length > 0);
});

const allPaths = navigationSections.flatMap(section => section.items.map(item => item.to));


const isActive = path => {
  const matches = candidate => route.path === candidate || route.path.startsWith(`${candidate}/`);
  if (!matches(path)) return false;
  return !allPaths.some(other => other !== path && other.length > path.length && matches(other));
};

const roleLabel = computed(() =>
    userStore.currentUser ? t(`shared.business-type.${userStore.currentUser.businessType}`) : '');
</script>

<template>
  <nav class="side-navigation" :aria-label="t('navigation.aria-label')">
    <router-link to="/dashboard" class="side-navigation__brand" @click="emit('navigate')">
      <img src="/favicon.svg" alt="" width="32" height="32"/>
      <span>Destilatech</span>
    </router-link>

    <div class="side-navigation__sections">
      <div v-for="section in visibleSections" :key="section.section" class="side-navigation__section">
        <span class="side-navigation__section-title">{{ t(section.section) }}</span>
        <ul>
          <li v-for="item in section.items" :key="item.to">
            <router-link :to="item.to" class="side-navigation__link"
                         :class="{ 'side-navigation__link--active': isActive(item.to) }"
                         :aria-current="isActive(item.to) ? 'page' : undefined"
                         @click="emit('navigate')">
              <i :class="item.icon" aria-hidden="true"></i>
              <span>{{ t(item.label) }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="userStore.currentUser" class="side-navigation__user">
      <strong>{{ userStore.currentUser.fullName }}</strong>
      <span>{{ userStore.currentUser.businessName }} · {{ roleLabel }}</span>
    </div>
  </nav>
</template>

<style scoped>
.side-navigation {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-primary-dark);
  color: #f5e6df;
  padding: var(--spacing-03) var(--spacing-02);
  gap: var(--spacing-03);
}

.side-navigation__brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.2rem;
  color: #fffdf9;
  padding: 0 0.5rem;
}

.side-navigation__sections {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 253, 249, 0.2) transparent;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-02);
}

.side-navigation__section ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.side-navigation__section-title {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #dca792;
  padding: 0 0.75rem 0.35rem;
}

.side-navigation__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: #f5e6df;
  transition: background 0.2s;
}

.side-navigation__link:hover {
  background: rgba(255, 253, 249, 0.08);
}

.side-navigation__link--active {
  background: var(--color-primary);
  color: #fffdf9;
  font-weight: 600;
}

.side-navigation__link--active i {
  color: var(--color-accent);
}

.side-navigation__user {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 253, 249, 0.12);
  font-size: 0.8rem;
}

.side-navigation__user strong {
  color: #fffdf9;
}

.side-navigation__user span {
  color: #dca792;
}
</style>
