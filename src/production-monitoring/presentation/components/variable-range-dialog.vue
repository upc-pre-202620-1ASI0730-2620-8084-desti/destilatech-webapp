<script setup>
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProcessVariable } from '@/production-monitoring/domain/model/process-variable.entity.js';


const props = defineProps({
  visible: { type: Boolean, default: false },
  variable: { type: ProcessVariable, default: null },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const form = reactive({ minRange: 0, maxRange: 0 });
const isValid = computed(() => form.minRange < form.maxRange);

watch(() => props.visible, visible => {
  if (!visible || !props.variable) return;
  form.minRange = props.variable.minRange;
  form.maxRange = props.variable.maxRange;
});

const onSubmit = () => {
  if (isValid.value) emit('save', { ...form });
};
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="t('production.range-form.title')" :style="{ width: '28rem' }"
             :breakpoints="{ '640px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form v-if="props.variable" id="variable-range-form" class="form-grid" @submit.prevent="onSubmit">
      <p class="text-muted">
        {{ t('production.range-form.description', { variable: t(`production.variables.${props.variable.type}`) }) }}
      </p>
      <div class="grid">
        <div class="col-6 form-field">
          <label for="range-min">{{ t('production.fields.min-range') }} ({{ props.variable.unit }})</label>
          <pv-input-number input-id="range-min" v-model="form.minRange" :min-fraction-digits="0"
                           :max-fraction-digits="props.variable.decimals" :invalid="!isValid" fluid/>
        </div>
        <div class="col-6 form-field">
          <label for="range-max">{{ t('production.fields.max-range') }} ({{ props.variable.unit }})</label>
          <pv-input-number input-id="range-max" v-model="form.maxRange" :min-fraction-digits="0"
                           :max-fraction-digits="props.variable.decimals" :invalid="!isValid" fluid/>
        </div>
      </div>
      <small v-if="!isValid" class="form-error">{{ t('production.errors.invalid-range') }}</small>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="variable-range-form" icon="pi pi-save" :label="t('common.save')"
                 :disabled="!isValid" :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
