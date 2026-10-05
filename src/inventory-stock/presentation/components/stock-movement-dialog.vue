<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MovementReason, MovementType } from '@/inventory-stock/domain/model/stock-movement.entity.js';


const props = defineProps({
  visible: { type: Boolean, default: false },
  inventoryItems: { type: Array, required: true },
  productId: { type: Number, default: null },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const REASONS_BY_TYPE = Object.freeze({
  [MovementType.IN]: [MovementReason.PURCHASE, MovementReason.PRODUCTION, MovementReason.RETURN, MovementReason.ADJUSTMENT],
  [MovementType.OUT]: [MovementReason.SALE, MovementReason.WASTE, MovementReason.ADJUSTMENT]
});

const form = reactive({ productId: null, type: MovementType.IN, quantity: 1, reason: MovementReason.PURCHASE, notes: '' });
const submitted = ref(false);

watch(() => props.visible, visible => {
  if (!visible) return;
  submitted.value = false;
  Object.assign(form, { productId: props.productId, type: MovementType.IN, quantity: 1, reason: MovementReason.PURCHASE, notes: '' });
});

watch(() => form.type, type => {
  if (!REASONS_BY_TYPE[type].includes(form.reason)) form.reason = REASONS_BY_TYPE[type][0];
});

const productOptions = computed(() => props.inventoryItems.map(item => ({
  value: item.product.id,
  label: `${item.product.displayName} (${item.stockItem.currentQuantity})`
})));
const typeOptions = computed(() => [
  { value: MovementType.IN, label: t('inventory.movement-type.IN') },
  { value: MovementType.OUT, label: t('inventory.movement-type.OUT') }
]);
const reasonOptions = computed(() => REASONS_BY_TYPE[form.type]
    .map(reason => ({ value: reason, label: t(`inventory.movement-reason.${reason}`) })));

const selectedItem = computed(() => props.inventoryItems.find(item => item.product.id === form.productId));
const availableStock = computed(() => selectedItem.value?.stockItem.currentQuantity ?? 0);
const exceedsStock = computed(() => form.type === MovementType.OUT && form.quantity > availableStock.value);
const resultingStock = computed(() =>
    availableStock.value + (form.type === MovementType.IN ? form.quantity : -form.quantity));

const close = () => emit('update:visible', false);

const onSubmit = () => {
  submitted.value = true;
  if (!form.productId || !(form.quantity > 0) || exceedsStock.value) return;
  emit('save', { ...form });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="t('inventory.movement-form.title')" :style="{ width: '32rem' }"
             :breakpoints="{ '640px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form id="stock-movement-form" class="form-grid" novalidate @submit.prevent="onSubmit">
      <div class="form-field">
        <label for="movement-product">{{ t('inventory.fields.product') }}</label>
        <pv-select input-id="movement-product" v-model="form.productId" :options="productOptions" option-label="label"
                   option-value="value" filter :disabled="props.productId !== null"
                   :placeholder="t('inventory.movement-form.select-product')"
                   :invalid="submitted && !form.productId" fluid/>
      </div>
      <pv-select-button v-model="form.type" :options="typeOptions" option-label="label" option-value="value"
                        :allow-empty="false" :aria-label="t('inventory.fields.movement-type')"/>
      <div class="grid">
        <div class="col-12 md:col-5 form-field">
          <label for="movement-quantity">{{ t('inventory.fields.quantity') }}</label>
          <pv-input-number input-id="movement-quantity" v-model="form.quantity" :min="1" show-buttons
                           :invalid="submitted && (!(form.quantity > 0) || exceedsStock)" fluid/>
        </div>
        <div class="col-12 md:col-7 form-field">
          <label for="movement-reason">{{ t('inventory.fields.reason') }}</label>
          <pv-select input-id="movement-reason" v-model="form.reason" :options="reasonOptions" option-label="label"
                     option-value="value" fluid/>
        </div>
      </div>
      <div class="form-field">
        <label for="movement-notes">{{ t('inventory.fields.notes') }}</label>
        <pv-textarea id="movement-notes" v-model="form.notes" rows="2" auto-resize fluid/>
      </div>

      <pv-message v-if="exceedsStock" severity="warn" :closable="false">
        {{ t('inventory.movement-form.insufficient-stock', { available: availableStock }) }}
      </pv-message>
      <p v-else-if="selectedItem" class="text-muted text-sm">
        {{ t('inventory.movement-form.resulting-stock', { current: availableStock, result: resultingStock }) }}
      </p>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="close"/>
      <pv-button type="submit" form="stock-movement-form" icon="pi pi-check" :label="t('inventory.movement-form.submit')"
                 :disabled="exceedsStock" :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
