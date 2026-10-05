<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useIamStore } from '@/iam/application/iam.store.js';


const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();
const menu = ref();

const items = computed(() => [
  {
    label: iamStore.currentUser?.email ?? '',
    items: [
      { label: t('navigation.profile'), icon: 'pi pi-user', command: () => router.push('/account/profile') },
      { label: t('navigation.subscription'), icon: 'pi pi-credit-card', command: () => router.push('/billing/plans') },
      { separator: true },
      {
        label: t('iam.sign-out'), icon: 'pi pi-sign-out', command: () => {
          iamStore.signOut();
          // Full reload so every bounded context store starts clean for the next account.
          window.location.assign(router.resolve({ name: 'sign-in' }).href);
        }
      }
    ]
  }
]);

const toggle = event => menu.value.toggle(event);
</script>

<template>
  <div v-if="iamStore.currentUser">
    <button type="button" class="user-menu__trigger" :aria-label="t('iam.account-menu')" aria-haspopup="true"
            aria-controls="user-menu-overlay" @click="toggle">
      <pv-avatar :label="iamStore.currentUser.initials" shape="circle" class="user-menu__avatar"/>
      <span class="user-menu__name">{{ iamStore.currentUser.fullName }}</span>
      <i class="pi pi-angle-down" aria-hidden="true"></i>
    </button>
    <pv-menu id="user-menu-overlay" ref="menu" :model="items" popup/>
  </div>
</template>

<style scoped>
.user-menu__trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  color: var(--color-text);
}

.user-menu__trigger:hover {
  background: var(--color-bg-alt);
}

.user-menu__avatar {
  background: var(--color-primary);
  color: #fffdf9;
}

.user-menu__name {
  font-weight: 500;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .user-menu__name {
    display: none;
  }
}
</style>
