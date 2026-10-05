<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useOrdersStore } from '@/orders-replenishment/application/orders.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { OrderStatus } from '@/orders-replenishment/domain/model/order.entity.js';
import { Money } from '@/shared/domain/model/money.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import KpiCard from '@/shared/presentation/components/kpi-card.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import OrderStatusTag from '@/orders-replenishment/presentation/components/order-status-tag.vue';
import OrderFormDialog from '@/orders-replenishment/presentation/components/order-form-dialog.vue';
import CustomerFormDialog from '@/orders-replenishment/presentation/components/customer-form-dialog.vue';


const { t, locale } = useI18n();
const confirm = useConfirm();
const toast = useToast();
const ordersStore = useOrdersStore();
const inventoryStore = useInventoryStore();

const statusFilter = ref('ALL');
const search = ref('');
const orderDialogVisible = ref(false);
const customerDialogVisible = ref(false);
const expandedRows = ref({});
const saving = ref(false);

const statusOptions = computed(() => [
  { value: 'ALL', label: t('common.all') },
  { value: 'OPEN', label: t('orders.filters.open') },
  { value: OrderStatus.DELIVERED, label: t('orders.filters.completed') },
  { value: OrderStatus.CANCELLED, label: t('orders.status.CANCELLED') }
]);

const filteredOrders = computed(() => {
  const term = search.value.trim().toLowerCase();
  return ordersStore.orders
      .filter(order => {
        if (statusFilter.value === 'ALL') return true;
        if (statusFilter.value === 'OPEN') return order.isOpen();
        return order.status === statusFilter.value;
      })
      .filter(order => !term || order.code.toLowerCase().includes(term) || order.customerName.toLowerCase().includes(term));
});

const monthSalesLabel = computed(() => new Money(ordersStore.currentMonthSales).format(locale.value));
const pendingCount = computed(() => ordersStore.orders.filter(order => order.status === OrderStatus.PENDING).length);

const showError = () => {
  const error = ordersStore.errors[0];
  toast.add({ severity: 'error', summary: t('common.error'), detail: t(`orders.errors.${error}`, error), life: 4000 });
};

const onSaveOrder = async command => {
  saving.value = true;
  const order = await ordersStore.registerOrder(command);
  saving.value = false;
  if (!order) return showError();
  orderDialogVisible.value = false;
  toast.add({ severity: 'success', summary: t('orders.toasts.order-registered', { code: order.code }), detail: t('orders.toasts.stock-discounted'), life: 3500 });
};

const onSaveCustomer = async data => {
  saving.value = true;
  const customer = await ordersStore.saveCustomer(data);
  saving.value = false;
  if (!customer) return showError();
  customerDialogVisible.value = false;
  toast.add({ severity: 'success', summary: t('orders.toasts.customer-saved'), life: 3000 });
};

const onAdvance = async order => {
  if (await ordersStore.advanceOrderStatus(order)) {
    toast.add({ severity: 'success', summary: t('orders.toasts.status-updated', { code: order.code, status: t(`orders.status.${order.status}`) }), life: 3000 });
  } else {
    showError();
  }
};

const onCancel = order => {
  confirm.require({
    header: t('orders.cancel.header', { code: order.code }),
    message: t('orders.cancel.message'),
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: t('orders.cancel.accept'), severity: 'danger' },
    rejectProps: { label: t('common.back'), outlined: true },
    accept: async () => {
      if (await ordersStore.cancelOrder(order)) {
        toast.add({ severity: 'info', summary: t('orders.toasts.order-cancelled', { code: order.code }), life: 3000 });
      } else {
        showError();
      }
    }
  });
};

onMounted(() => {
  ordersStore.fetchOrders({ force: true });
  inventoryStore.fetchInventory({ force: true });
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('orders.title')" :subtitle="t('orders.subtitle')">
      <template #actions>
        <pv-button icon="pi pi-plus" :label="t('orders.new-order')" @click="orderDialogVisible = true"/>
      </template>
    </page-header>

    <div class="kpi-grid">
      <kpi-card :label="t('orders.kpis.month-sales')" :value="monthSalesLabel" icon="pi pi-wallet" :loading="ordersStore.loading"
                :caption="t('orders.kpis.month-sales-caption')" tone="success"/>
      <kpi-card :label="t('orders.kpis.open')" :value="ordersStore.openOrders.length" icon="pi pi-shopping-cart"
                :loading="ordersStore.loading" :caption="t('orders.kpis.pending', { count: pendingCount })" tone="warn"/>
      <kpi-card :label="t('orders.kpis.total')" :value="ordersStore.orders.length" icon="pi pi-list"
                :loading="ordersStore.loading" :caption="t('orders.kpis.customers', { count: ordersStore.customers.length })"/>
    </div>

    <div class="surface-panel">
      <div class="surface-panel__header">
        <pv-select-button v-model="statusFilter" :options="statusOptions" option-label="label" option-value="value"
                          :allow-empty="false" :aria-label="t('orders.fields.status')"/>
        <pv-icon-field>
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text v-model="search" :placeholder="t('orders.search-placeholder')" :aria-label="t('orders.search-placeholder')"/>
        </pv-icon-field>
      </div>
      <pv-data-table v-model:expanded-rows="expandedRows" :value="filteredOrders" :loading="ordersStore.loading" data-key="id"
                     paginator :rows="10" striped-rows>
        <template #empty>
          <empty-state icon="pi pi-shopping-cart" :title="t('orders.empty.title')" :description="t('orders.empty.description')">
            <pv-button icon="pi pi-plus" :label="t('orders.new-order')" @click="orderDialogVisible = true"/>
          </empty-state>
        </template>
        <pv-column expander style="width: 3rem"/>
        <pv-column field="code" :header="t('orders.fields.order')" sortable>
          <template #body="{ data }"><span class="font-semibold">{{ data.code }}</span></template>
        </pv-column>
        <pv-column field="customerName" :header="t('orders.fields.customer')" sortable/>
        <pv-column :header="t('common.date')" sortable sort-field="orderDate">
          <template #body="{ data }">{{ data.orderDate.format(locale) }}</template>
        </pv-column>
        <pv-column :header="t('orders.fields.total')">
          <template #body="{ data }">{{ data.total.format(locale) }}</template>
        </pv-column>
        <pv-column :header="t('orders.fields.status')">
          <template #body="{ data }"><order-status-tag :status="data.status"/></template>
        </pv-column>
        <pv-column :header="t('common.actions')" style="width: 12rem">
          <template #body="{ data }">
            <div class="flex gap-1 align-items-center">
              <pv-button v-if="data.nextStatus" size="small" outlined icon="pi pi-forward"
                         :label="t(`orders.advance.${data.nextStatus}`)" @click="onAdvance(data)"/>
              <pv-button v-if="data.isOpen()" icon="pi pi-times" text rounded severity="danger"
                         v-tooltip.top="t('orders.cancel.action')" :aria-label="t('orders.cancel.action')" @click="onCancel(data)"/>
            </div>
          </template>
        </pv-column>
        <template #expansion="{ data }">
          <div class="p-3">
            <pv-data-table :value="data.lines" size="small">
              <pv-column field="productName" :header="t('inventory.fields.product')"/>
              <pv-column field="quantity" :header="t('inventory.fields.quantity')"/>
              <pv-column :header="t('inventory.fields.unit-price')">
                <template #body="{ data: line }">{{ line.unitPrice.format(locale) }}</template>
              </pv-column>
              <pv-column :header="t('orders.fields.subtotal')">
                <template #body="{ data: line }">{{ line.subtotal.format(locale) }}</template>
              </pv-column>
            </pv-data-table>
            <p v-if="data.notes" class="text-muted text-sm mt-2">{{ data.notes }}</p>
          </div>
        </template>
      </pv-data-table>
    </div>

    <order-form-dialog v-model:visible="orderDialogVisible" :customers="ordersStore.customers"
                       :inventory-items="inventoryStore.inventoryItems" :saving="saving" @save="onSaveOrder"
                       @new-customer="customerDialogVisible = true"/>
    <customer-form-dialog v-model:visible="customerDialogVisible" :saving="saving" @save="onSaveCustomer"/>
  </section>
</template>
