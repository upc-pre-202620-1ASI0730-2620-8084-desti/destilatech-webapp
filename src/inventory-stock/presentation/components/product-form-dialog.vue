<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MeasurementUnit, Product } from '@/inventory-stock/domain/model/product.entity.js';


const props = defineProps({
  visible: { type: Boolean, default: false },
  product: { type: Product, default: null },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const PISCO_CATEGORIES = ['Quebranta', 'Italia', 'Acholado', 'Torontel', 'Mollar', 'Negra Criolla', 'Moscatel', 'Albilla', 'Uvina', 'Mosto Verde'];

const emptyForm = () => ({
  name: '', presentation: '750 ml', unit: MeasurementUnit.BOTTLE, category: '', unitPrice: 0, sku: '',
  initialQuantity: 0, lowStockThreshold: 10
});

const form = reactive(emptyForm());
const submitted = ref(false);
const isEditing = computed(() => props.product !== null);

const unitOptions = computed(() => Object.values(MeasurementUnit)
    .map(unit => ({ value: unit, label: t(`inventory.units.${unit}`) })));

watch(() => props.visible, visible => {
  if (!visible) return;
  submitted.value = false;
  Object.assign(form, emptyForm());
  if (props.product) {
    Object.assign(form, {
      name: props.product.name,
      presentation: props.product.presentation,
      unit: props.product.unit,
      category: props.product.category,
      unitPrice: props.product.unitPrice.amount,
      sku: props.product.sku
    });
  }
});

const close = () => emit('update:visible', false);

const onSubmit = () => {
  submitted.value = true;
  if (!form.name.trim()) return;
  emit('save', { ...form });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="isEditing ? t('inventory.product-form.edit-title') : t('inventory.product-form.new-title')"
             :style="{ width: '36rem' }" :breakpoints="{ '640px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form id="product-form" class="form-grid" novalidate @submit.prevent="onSubmit">
      <div class="form-field">
        <label for="product-name">{{ t('inventory.fields.name') }}</label>
        <pv-input-text id="product-name" v-model="form.name" :invalid="submitted && !form.name.trim()"
                       :placeholder="t('inventory.product-form.name-placeholder')" fluid/>
        <small v-if="submitted && !form.name.trim()" class="form-error">{{ t('validation.required') }}</small>
      </div>
      <div class="grid">
        <div class="col-12 md:col-6 form-field">
          <label for="product-presentation">{{ t('inventory.fields.presentation') }}</label>
          <pv-input-text id="product-presentation" v-model="form.presentation" fluid/>
        </div>
        <div class="col-12 md:col-6 form-field">
          <label for="product-unit">{{ t('inventory.fields.unit') }}</label>
          <pv-select input-id="product-unit" v-model="form.unit" :options="unitOptions" option-label="label"
                     option-value="value" fluid/>
        </div>
        <div class="col-12 md:col-6 form-field">
          <label for="product-category">{{ t('inventory.fields.category') }}</label>
          <pv-select input-id="product-category" v-model="form.category" :options="PISCO_CATEGORIES" editable
                     :placeholder="t('inventory.product-form.category-placeholder')" fluid/>
        </div>
        <div class="col-12 md:col-6 form-field">
          <label for="product-price">{{ t('inventory.fields.unit-price') }}</label>
          <pv-input-number input-id="product-price" v-model="form.unitPrice" mode="currency" currency="PEN"
                           locale="es-PE" :min="0" fluid/>
        </div>
        <div class="col-12 md:col-6 form-field">
          <label for="product-sku">{{ t('inventory.fields.sku') }}</label>
          <pv-input-text id="product-sku" v-model="form.sku" fluid/>
        </div>
        <template v-if="!isEditing">
          <div class="col-12 md:col-6 form-field">
            <label for="product-initial-quantity">{{ t('inventory.fields.initial-quantity') }}</label>
            <pv-input-number input-id="product-initial-quantity" v-model="form.initialQuantity" :min="0" show-buttons fluid/>
          </div>
          <div class="col-12 md:col-6 form-field">
            <label for="product-threshold">{{ t('inventory.fields.low-stock-threshold') }}</label>
            <pv-input-number input-id="product-threshold" v-model="form.lowStockThreshold" :min="0" show-buttons fluid/>
          </div>
        </template>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="close"/>
      <pv-button type="submit" form="product-form" icon="pi pi-save" :label="t('common.save')" :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
