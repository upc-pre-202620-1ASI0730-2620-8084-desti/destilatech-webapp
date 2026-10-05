<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useOrdersStore } from '@/orders-replenishment/application/orders.store.js';
import { OrderStatus } from '@/orders-replenishment/domain/model/order.entity.js';
import { Money } from '@/shared/domain/model/money.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import CustomerFormDialog from '@/orders-replenishment/presentation/components/customer-form-dialog.vue';


const { t, locale } = useI18n();
const toast = useToast();
const ordersStore = useOrdersStore();

const search = ref('');
const dialogVisible = ref(false);
const customerToEdit = ref(null);
const saving = ref(false);

const customerRows = computed(() => {
  const term = search.value.trim().toLowerCase();
  return ordersStore.customers
      .filter(customer => !term || [customer.name, customer.contactName, customer.email, customer.phone]
          .some(value => value?.toLowerCase().includes(term)))
      .map(customer => {
        const customerOrders = ordersStore.ordersForCustomer(customer.id).filter(order => order.status !== OrderStatus.CANCELLED);
        const purchased = customerOrders.reduce((sum, order) => sum + order.total.amount, 0);
        return { customer, ordersCount: customerOrders.length, purchased: new Money(purchased) };
      });
});

const openDialog = (customer = null) => {
  customerToEdit.value = customer;
  dialogVisible.value = true;
};

const onSave = async data => {
  saving.value = true;
  const saved = await ordersStore.saveCustomer(data);
  saving.value = false;
  if (saved) {
    dialogVisible.value = false;
    toast.add({ severity: 'success', summary: t('orders.toasts.customer-saved'), life: 3000 });
  } else {
    const error = ordersStore.errors[0];
    toast.add({ severity: 'error', summary: t('common.error'), detail: t(`orders.errors.${error}`, error), life: 4000 });
  }
};

onMounted(() => ordersStore.fetchOrders({ force: true }));
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('orders.customers.title')" :subtitle="t('orders.customers.subtitle', { count: ordersStore.customers.length })">
      <template #actions>
        <pv-button icon="pi pi-user-plus" :label="t('orders.new-customer')" @click="openDialog()"/>
      </template>
    </page-header>

    <div class="surface-panel">
      <div class="surface-panel__header">
        <pv-icon-field>
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text v-model="search" :placeholder="t('orders.customers.search-placeholder')"
                         :aria-label="t('orders.customers.search-placeholder')"/>
        </pv-icon-field>
      </div>
      <pv-data-table :value="customerRows" :loading="ordersStore.loading" data-key="customer.id" paginator :rows="10" striped-rows>
        <template #empty>
          <empty-state icon="pi pi-users" :title="t('orders.customers.empty-title')" :description="t('orders.customers.empty-description')">
            <pv-button icon="pi pi-user-plus" :label="t('orders.new-customer')" @click="openDialog()"/>
          </empty-state>
        </template>
        <pv-column :header="t('orders.fields.customer')" sortable sort-field="customer.name">
          <template #body="{ data }">
            <div class="flex flex-column">
              <span class="font-semibold">{{ data.customer.name }}</span>
              <span class="text-muted text-sm">{{ t(`orders.customer-type.${data.customer.customerType}`) }}</span>
            </div>
          </template>
        </pv-column>
        <pv-column :header="t('orders.fields.contact')">
          <template #body="{ data }">
            <div class="flex flex-column text-sm">
              <span>{{ data.customer.contactName || '—' }}</span>
              <span class="text-muted">{{ [data.customer.phone, data.customer.email].filter(Boolean).join(' · ') }}</span>
            </div>
          </template>
        </pv-column>
        <pv-column field="customer.address" :header="t('orders.fields.address')"/>
        <pv-column field="ordersCount" :header="t('orders.customers.orders')" sortable/>
        <pv-column :header="t('orders.customers.purchased')" sortable sort-field="purchased.amount">
          <template #body="{ data }">{{ data.purchased.format(locale) }}</template>
        </pv-column>
        <pv-column style="width: 4rem">
          <template #body="{ data }">
            <pv-button icon="pi pi-pencil" text rounded :aria-label="t('common.edit')" @click="openDialog(data.customer)"/>
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <customer-form-dialog v-model:visible="dialogVisible" :customer="customerToEdit" :saving="saving" @save="onSave"/>
  </section>
</template>
