<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';


const props = defineProps({
  visible: { type: Boolean, default: false },
  inventoryItems: { type: Array, required: true },
  suggestion: { type: Object, default: null },
  suppliers: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const emptyForm = () => ({ supplierName: '', supplierContact: '', productId: null, quantity: 12, expectedDate: null, notes: '' });
const form = reactive(emptyForm());
const submitted = ref(false);

watch(() => props.visible, visible => {
  if (!visible) return;
  submitted.value = false;
  Object.assign(form, emptyForm());
  if (props.suggestion) Object.assign(form, props.suggestion);
});

const productOptions = computed(() => props.inventoryItems.map(item => ({
  value: item.product.id,
  label: `${item.product.displayName} (${item.stockItem.currentQuantity})`
})));

const isValid = computed(() => form.supplierName.trim() && form.productId && form.quantity > 0);

const onSubmit = () => {
  submitted.value = true;
  if (isValid.value) emit('save', { ...form });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="t('orders.replenishment.form-title')" :style="{ width: '34rem' }"
             :breakpoints="{ '640px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form id="replenishment-form" class="grid" novalidate @submit.prevent="onSubmit">
      <div class="col-12 form-field">
        <label for="replenishment-product">{{ t('inventory.fields.product') }}</label>
        <pv-select input-id="replenishment-product" v-model="form.productId" :options="productOptions" option-label="label"
                   option-value="value" filter :invalid="submitted && !form.productId" fluid/>
      </div>
      <div class="col-12 md:col-7 form-field">
        <label for="replenishment-supplier">{{ t('orders.fields.supplier') }}</label>
        <pv-select input-id="replenishment-supplier" v-model="form.supplierName" :options="props.suppliers" editable
                   :invalid="submitted && !form.supplierName.trim()" fluid/>
      </div>
      <div class="col-12 md:col-5 form-field">
        <label for="replenishment-quantity">{{ t('inventory.fields.quantity') }}</label>
        <pv-input-number input-id="replenishment-quantity" v-model="form.quantity" :min="1" show-buttons fluid/>
      </div>
      <div class="col-12 md:col-7 form-field">
        <label for="replenishment-contact">{{ t('orders.fields.supplier-contact') }}</label>
        <pv-input-text id="replenishment-contact" v-model="form.supplierContact" :placeholder="t('orders.replenishment.contact-placeholder')" fluid/>
      </div>
      <div class="col-12 md:col-5 form-field">
        <label for="replenishment-expected">{{ t('orders.fields.expected-date') }}</label>
        <pv-date-picker input-id="replenishment-expected" v-model="form.expectedDate" date-format="dd/mm/yy"
                        :min-date="new Date()" show-icon fluid/>
      </div>
      <div class="col-12 form-field">
        <label for="replenishment-notes">{{ t('orders.fields.notes') }}</label>
        <pv-textarea id="replenishment-notes" v-model="form.notes" rows="2" auto-resize fluid/>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="replenishment-form" icon="pi pi-send" :label="t('orders.replenishment.submit')"
                 :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
