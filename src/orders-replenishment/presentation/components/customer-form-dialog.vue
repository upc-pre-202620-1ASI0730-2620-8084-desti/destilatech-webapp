<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Customer, CustomerType } from '@/orders-replenishment/domain/model/customer.entity.js';

/**
 * Dialog to register or edit a customer (US17).
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  customer: { type: Customer, default: null },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const emptyForm = () => ({ id: null, name: '', contactName: '', phone: '', email: '', address: '', customerType: CustomerType.LIQUOR_STORE });
const form = reactive(emptyForm());
const submitted = ref(false);

const typeOptions = computed(() => Object.values(CustomerType).map(type => ({ value: type, label: t(`orders.customer-type.${type}`) })));
const hasContact = computed(() => form.phone.trim() || form.email.trim());

watch(() => props.visible, visible => {
  if (!visible) return;
  submitted.value = false;
  Object.assign(form, emptyForm(), props.customer ? { ...props.customer } : {});
});

const onSubmit = () => {
  submitted.value = true;
  if (!form.name.trim() || !hasContact.value) return;
  emit('save', { ...form });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :style="{ width: '34rem' }" :breakpoints="{ '640px': '95vw' }"
             :header="props.customer ? t('orders.customer-form.edit-title') : t('orders.customer-form.new-title')"
             @update:visible="emit('update:visible', $event)">
    <form id="customer-form" class="grid" novalidate @submit.prevent="onSubmit">
      <div class="col-12 md:col-7 form-field">
        <label for="customer-name">{{ t('orders.fields.customer-name') }}</label>
        <pv-input-text id="customer-name" v-model="form.name" :invalid="submitted && !form.name.trim()" fluid/>
        <small v-if="submitted && !form.name.trim()" class="form-error">{{ t('validation.required') }}</small>
      </div>
      <div class="col-12 md:col-5 form-field">
        <label for="customer-type">{{ t('orders.fields.customer-type') }}</label>
        <pv-select input-id="customer-type" v-model="form.customerType" :options="typeOptions" option-label="label"
                   option-value="value" fluid/>
      </div>
      <div class="col-12 form-field">
        <label for="customer-contact">{{ t('orders.fields.contact-name') }}</label>
        <pv-input-text id="customer-contact" v-model="form.contactName" fluid/>
      </div>
      <div class="col-12 md:col-6 form-field">
        <label for="customer-phone">{{ t('orders.fields.phone') }}</label>
        <pv-input-text id="customer-phone" v-model="form.phone" type="tel" :invalid="submitted && !hasContact" fluid/>
      </div>
      <div class="col-12 md:col-6 form-field">
        <label for="customer-email">{{ t('orders.fields.email') }}</label>
        <pv-input-text id="customer-email" v-model="form.email" type="email" :invalid="submitted && !hasContact" fluid/>
      </div>
      <small v-if="submitted && !hasContact" class="col-12 form-error">{{ t('orders.errors.contact-required') }}</small>
      <div class="col-12 form-field">
        <label for="customer-address">{{ t('orders.fields.address') }}</label>
        <pv-input-text id="customer-address" v-model="form.address" fluid/>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="customer-form" icon="pi pi-save" :label="t('common.save')" :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
