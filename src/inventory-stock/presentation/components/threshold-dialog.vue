<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';


const props = defineProps({
  visible: { type: Boolean, default: false },
  productName: { type: String, default: '' },
  currentThreshold: { type: Number, default: 0 },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const threshold = ref(0);

watch(() => props.visible, visible => {
  if (visible) threshold.value = props.currentThreshold;
});
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="t('inventory.threshold-form.title')" :style="{ width: '26rem' }"
             :breakpoints="{ '640px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form id="threshold-form" class="form-grid" @submit.prevent="emit('save', threshold)">
      <p class="text-muted">{{ t('inventory.threshold-form.description', { product: props.productName }) }}</p>
      <div class="form-field">
        <label for="threshold-value">{{ t('inventory.fields.low-stock-threshold') }}</label>
        <pv-input-number input-id="threshold-value" v-model="threshold" :min="0" show-buttons fluid/>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="threshold-form" icon="pi pi-save" :label="t('common.save')" :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
