<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useIamStore } from '@/iam/application/iam.store.js';
import { useUserStore } from '@/shared/application/user.store.js';

const { t } = useI18n();
const router = useRouter();
const iamStore = useIamStore();
const userStore = useUserStore();
const menu = ref();

const user = computed(() => userStore.currentUser);
const items = computed(() => [
  { label: user.value?.email ?? '', disabled: true },
  { separator: true },
  { label: t('iam.account.plans'), icon: 'pi pi-credit-card', command: () => router.push({ name: 'subscription-plans' }) },
  { label: t('iam.account.sign-out'), icon: 'pi pi-sign-out', command: onSignOut }
]);

function onSignOut() {
  iamStore.signOut();
  // A full reload clears the data of the previous account kept in the other stores
  window.location.assign('/login');
}
</script>

<template>
  <div v-if="user">
    <pv-button class="account-menu__trigger" text :aria-label="t('iam.account.menu', { name: user.fullName })"
               aria-haspopup="true" aria-controls="account-menu" @click="menu.toggle($event)">
      <pv-avatar :label="user.initials" shape="circle" class="account-menu__avatar"/>
      <span class="account-menu__name">{{ user.fullName }}</span>
      <i class="pi pi-angle-down" aria-hidden="true"></i>
    </pv-button>
    <pv-menu id="account-menu" ref="menu" :model="items" popup/>
  </div>
</template>

<style scoped>
.account-menu__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
}

.account-menu__avatar {
  background: var(--color-primary);
  color: #fff;
  width: 2rem;
  height: 2rem;
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .account-menu__name {
    display: none;
  }
}
</style>
