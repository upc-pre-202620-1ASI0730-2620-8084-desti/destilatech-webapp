<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Money } from '@/shared/domain/model/money.js';

/**
 * Dialog to register a customer order with one or more product lines (US18).
 *
 * @remarks
 * Shows a warning before confirming when a line exceeds the available stock
 * and blocks the confirmation (stock can never be negative).
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  /** @type {import('@/orders-replenishment/domain/model/customer.entity.js').Customer[]} */
  customers: { type: Array, required: true },
  /** @type {import('@/inventory-stock/application/inventory.store.js').InventoryItem[]} */
  inventoryItems: { type: Array, required: true },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save', 'new-customer']);
const { t, locale } = useI18n();

const form = reactive({ customerId: null, lines: [], notes: '' });
const submitted = ref(false);

const newLine = () => ({ key: crypto.randomUUID(), productId: null, quantity: 1 });

watch(() => props.visible, visible => {
  if (!visible) return;
  submitted.value = false;
  Object.assign(form, { customerId: null, lines: [newLine()], notes: '' });
});

const customerOptions = computed(() => props.customers.map(customer => ({ value: customer.id, label: customer.name })));
const productOptions = computed(() => props.inventoryItems.map(item => ({
  value: item.product.id,
  label: `${item.product.displayName} — ${t('orders.order-form.available', { count: item.stockItem.currentQuantity })}`,
  disabled: item.stockItem.currentQuantity === 0
})));

/** @param {number} productId */
const itemFor = productId => props.inventoryItems.find(item => item.product.id === productId);

/** @param {{productId: number, quantity: number}} line */
const lineExceedsStock = line => {
  const item = itemFor(line.productId);
  return item ? line.quantity > item.stockItem.currentQuantity : false;
};

/** @param {{productId: number, quantity: number}} line */
const lineSubtotal = line => {
  const item = itemFor(line.productId);
  return item ? item.product.unitPrice.multiply(line.quantity || 0) : new Money(0);
};

const total = computed(() => form.lines.reduce((sum, line) => sum.add(lineSubtotal(line)), new Money(0)));
const validLines = computed(() => form.lines.filter(line => line.productId && line.quantity > 0));
const hasStockIssues = computed(() => form.lines.some(lineExceedsStock));
const hasDuplicatedProducts = computed(() => new Set(validLines.value.map(line => line.productId)).size !== validLines.value.length);

const removeLine = key => {
  form.lines = form.lines.filter(line => line.key !== key);
  if (!form.lines.length) form.lines.push(newLine());
};

const onSubmit = () => {
  submitted.value = true;
  if (!form.customerId || !validLines.value.length || hasStockIssues.value || hasDuplicatedProducts.value) return;
  emit('save', {
    customerId: form.customerId,
    lines: validLines.value.map(({ productId, quantity }) => ({ productId, quantity })),
    notes: form.notes
  });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="t('orders.order-form.title')" :style="{ width: '44rem' }"
             :breakpoints="{ '768px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form id="order-form" class="form-grid" novalidate @submit.prevent="onSubmit">
      <div class="form-field">
        <label for="order-customer">{{ t('orders.fields.customer') }}</label>
        <div class="flex gap-2">
          <pv-select input-id="order-customer" v-model="form.customerId" :options="customerOptions" option-label="label"
                     option-value="value" filter :placeholder="t('orders.order-form.select-customer')"
                     :invalid="submitted && !form.customerId" class="flex-1"/>
          <pv-button icon="pi pi-user-plus" outlined v-tooltip.top="t('orders.new-customer')"
                     :aria-label="t('orders.new-customer')" @click="emit('new-customer')"/>
        </div>
        <small v-if="submitted && !form.customerId" class="form-error">{{ t('orders.errors.customer-required') }}</small>
      </div>

      <div class="flex flex-column gap-2">
        <span class="font-medium text-sm">{{ t('orders.order-form.products') }}</span>
        <div v-for="line in form.lines" :key="line.key" class="order-line">
          <pv-select v-model="line.productId" :options="productOptions" option-label="label" option-value="value"
                     option-disabled="disabled" filter :placeholder="t('orders.order-form.select-product')"
                     :aria-label="t('orders.order-form.select-product')" class="order-line__product"/>
          <pv-input-number v-model="line.quantity" :min="1" show-buttons :invalid="lineExceedsStock(line)"
                           :aria-label="t('inventory.fields.quantity')" input-class="w-4rem" class="order-line__quantity"/>
          <span class="order-line__subtotal">{{ lineSubtotal(line).format(locale) }}</span>
          <pv-button icon="pi pi-trash" text rounded severity="danger" :aria-label="t('common.delete')" @click="removeLine(line.key)"/>
        </div>
        <pv-button icon="pi pi-plus" :label="t('orders.order-form.add-line')" text class="align-self-start"
                   @click="form.lines.push(newLine())"/>
      </div>

      <pv-message v-if="hasStockIssues" severity="warn" :closable="false">{{ t('orders.order-form.stock-warning') }}</pv-message>
      <pv-message v-if="hasDuplicatedProducts" severity="warn" :closable="false">{{ t('orders.order-form.duplicated') }}</pv-message>
      <small v-if="submitted && !validLines.length" class="form-error">{{ t('orders.errors.lines-required') }}</small>

      <div class="form-field">
        <label for="order-notes">{{ t('orders.fields.notes') }}</label>
        <pv-textarea id="order-notes" v-model="form.notes" rows="2" auto-resize fluid/>
      </div>

      <div class="order-total">
        <span>{{ t('orders.fields.total') }}</span>
        <strong>{{ total.format(locale) }}</strong>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="order-form" icon="pi pi-check" :label="t('orders.order-form.submit')"
                 :disabled="hasStockIssues || hasDuplicatedProducts" :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.order-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 6.5rem auto;
  gap: 0.5rem;
  align-items: center;
}

.order-line__subtotal {
  text-align: right;
  font-weight: 500;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--color-bg-alt);
  border-radius: var(--radius-sm);
}

.order-total strong {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--color-primary-dark);
}

@media (max-width: 640px) {
  .order-line {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
