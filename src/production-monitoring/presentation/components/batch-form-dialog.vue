<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Dialog to register a new production batch (US06).
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  /** Inventory products that can receive the bottled units: [{value, label}]. */
  productOptions: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const GRAPE_VARIETIES = ['Quebranta', 'Italia', 'Acholado', 'Torontel', 'Mollar', 'Negra Criolla', 'Moscatel', 'Albilla', 'Uvina'];

const emptyForm = () => ({ variety: 'Quebranta', startDate: new Date(), estimatedQuantity: 500, tank: '', productId: null, notes: '' });
const form = reactive(emptyForm());
const submitted = ref(false);

watch(() => props.visible, visible => {
  if (!visible) return;
  submitted.value = false;
  Object.assign(form, emptyForm());
});

const isValid = computed(() => form.startDate && form.variety && form.estimatedQuantity > 0);

const onSubmit = () => {
  submitted.value = true;
  if (!isValid.value) return;
  emit('save', { ...form });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="t('production.batch-form.title')" :style="{ width: '34rem' }"
             :breakpoints="{ '640px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form id="batch-form" class="grid" novalidate @submit.prevent="onSubmit">
      <div class="col-12 md:col-6 form-field">
        <label for="batch-variety">{{ t('production.fields.variety') }}</label>
        <pv-select input-id="batch-variety" v-model="form.variety" :options="GRAPE_VARIETIES" editable fluid
                   :invalid="submitted && !form.variety"/>
      </div>
      <div class="col-12 md:col-6 form-field">
        <label for="batch-start-date">{{ t('production.fields.start-date') }}</label>
        <pv-date-picker input-id="batch-start-date" v-model="form.startDate" date-format="dd/mm/yy" show-icon
                        :max-date="new Date()" :invalid="submitted && !form.startDate" fluid/>
        <small v-if="submitted && !form.startDate" class="form-error">{{ t('production.errors.start-date-required') }}</small>
      </div>
      <div class="col-12 md:col-6 form-field">
        <label for="batch-quantity">{{ t('production.fields.estimated-quantity') }}</label>
        <pv-input-number input-id="batch-quantity" v-model="form.estimatedQuantity" :min="1" suffix=" L" fluid
                         :invalid="submitted && !(form.estimatedQuantity > 0)"/>
      </div>
      <div class="col-12 md:col-6 form-field">
        <label for="batch-tank">{{ t('production.fields.tank') }}</label>
        <pv-input-text id="batch-tank" v-model="form.tank" :placeholder="t('production.batch-form.tank-placeholder')" fluid/>
      </div>
      <div class="col-12 form-field">
        <label for="batch-product">{{ t('production.fields.product') }}</label>
        <pv-select input-id="batch-product" v-model="form.productId" :options="props.productOptions" option-label="label"
                   option-value="value" show-clear :placeholder="t('production.batch-form.product-placeholder')" fluid/>
        <small class="text-muted">{{ t('production.batch-form.product-help') }}</small>
      </div>
      <div class="col-12 form-field">
        <label for="batch-notes">{{ t('production.fields.notes') }}</label>
        <pv-textarea id="batch-notes" v-model="form.notes" rows="2" auto-resize fluid/>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="batch-form" icon="pi pi-save" :label="t('production.batch-form.submit')" :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
