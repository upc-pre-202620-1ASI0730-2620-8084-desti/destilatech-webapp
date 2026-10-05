<script setup>
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useIamStore } from '@/iam/application/iam.store.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';

const { t, locale } = useI18n();
const toast = useToast();
const iamStore = useIamStore();

const user = computed(() => iamStore.currentUser);
const form = reactive({ fullName: '', businessName: '' });

watch(user, current => {
  if (!current) return;
  form.fullName = current.fullName;
  form.businessName = current.businessName;
}, { immediate: true });

const accessLabel = computed(() => {
  if (!user.value) return '';
  if (user.value.hasPaidAccess()) {
    return t('iam.profile.access-paid', { date: user.value.accessGrantedUntil.format(locale.value) });
  }
  if (!user.value.trialPeriod.isExpired()) {
    return t('iam.profile.access-trial', { days: user.value.trialPeriod.daysRemaining() });
  }
  return t('iam.profile.access-expired');
});

const onSave = async () => {
  if (!form.fullName.trim() || !form.businessName.trim()) return;
  const saved = await iamStore.updateProfile({ fullName: form.fullName.trim(), businessName: form.businessName.trim() });
  toast.add(saved
      ? { severity: 'success', summary: t('common.saved'), detail: t('iam.profile.saved'), life: 3000 }
      : { severity: 'error', summary: t('common.error'), detail: iamStore.errors[0], life: 4000 });
};
</script>

<template>
  <section v-if="user" class="flex flex-column gap-4">
    <page-header :title="t('iam.profile.title')" :subtitle="t('iam.profile.subtitle')"/>

    <div class="content-grid">
      <form class="surface-panel form-grid" @submit.prevent="onSave">
        <h2>{{ t('iam.profile.account-data') }}</h2>
        <div class="form-field">
          <label for="profile-full-name">{{ t('iam.fields.full-name') }}</label>
          <pv-input-text id="profile-full-name" v-model="form.fullName" fluid/>
        </div>
        <div class="form-field">
          <label for="profile-business-name">{{ t('iam.fields.business-name') }}</label>
          <pv-input-text id="profile-business-name" v-model="form.businessName" fluid/>
        </div>
        <div class="form-field">
          <label for="profile-email">{{ t('iam.fields.email') }}</label>
          <pv-input-text id="profile-email" :model-value="user.email" disabled fluid/>
        </div>
        <div>
          <pv-button type="submit" icon="pi pi-save" :label="t('common.save-changes')"/>
        </div>
      </form>

      <aside class="surface-panel flex flex-column gap-3">
        <div class="flex align-items-center gap-3">
          <pv-avatar :label="user.initials" size="xlarge" shape="circle" class="profile-avatar"/>
          <div>
            <h2>{{ user.fullName }}</h2>
            <p class="text-muted">{{ user.businessName }}</p>
          </div>
        </div>
        <pv-divider/>
        <dl class="profile-facts">
          <dt>{{ t('iam.fields.business-type') }}</dt>
          <dd><pv-tag :value="t(`iam.business-type.${user.businessType}`)" severity="secondary"/></dd>
          <dt>{{ t('iam.profile.member-since') }}</dt>
          <dd>{{ user.createdAt.format(locale) }}</dd>
          <dt>{{ t('iam.profile.access') }}</dt>
          <dd>{{ accessLabel }}</dd>
        </dl>
        <router-link to="/billing/plans">
          <pv-button icon="pi pi-credit-card" :label="t('iam.profile.manage-subscription')" outlined fluid/>
        </router-link>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.profile-avatar {
  background: var(--color-primary);
  color: #fffdf9;
}

.profile-facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.6rem 1rem;
  margin: 0;
}

.profile-facts dt {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.profile-facts dd {
  margin: 0;
  font-weight: 500;
}
</style>
