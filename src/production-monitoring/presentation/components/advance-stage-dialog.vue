<script setup>
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProductionBatch } from '@/production-monitoring/domain/model/production-batch.entity.js';
import { BatchStage } from '@/production-monitoring/domain/model/batch-stage.js';
import BatchStageTag from './batch-stage-tag.vue';

/**
 * Dialog to move a batch to its next stage (US07). When the next stage is
 * BOTTLED, it also captures the bottled units that will enter the inventory.
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  batch: { type: ProductionBatch, default: null },
  productOptions: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['update:visible', 'save']);
const { t } = useI18n();

const form = reactive({ notes: '', bottledUnits: 0, productId: null });
const isBottling = computed(() => props.batch?.nextStage === BatchStage.BOTTLED);

watch(() => props.visible, visible => {
  if (!visible || !props.batch) return;
  Object.assign(form, {
    notes: '',
    // Suggested value: the estimated liters bottled in 750 ml presentations.
    bottledUnits: Math.round(props.batch.estimatedQuantity / 0.75),
    productId: props.batch.productId
  });
});
</script>

<template>
  <pv-dialog :visible="props.visible" modal :header="t('production.advance-stage.title')" :style="{ width: '30rem' }"
             :breakpoints="{ '640px': '95vw' }" @update:visible="emit('update:visible', $event)">
    <form v-if="props.batch" id="advance-stage-form" class="form-grid" @submit.prevent="emit('save', { ...form })">
      <div class="flex align-items-center gap-2 flex-wrap">
        <span class="font-semibold">{{ props.batch.code }}</span>
        <batch-stage-tag :stage="props.batch.stage"/>
        <i class="pi pi-arrow-right text-muted" aria-hidden="true"></i>
        <batch-stage-tag :stage="props.batch.nextStage"/>
      </div>
      <template v-if="isBottling">
        <div class="form-field">
          <label for="bottled-units">{{ t('production.fields.bottled-units') }}</label>
          <pv-input-number input-id="bottled-units" v-model="form.bottledUnits" :min="0" show-buttons fluid/>
        </div>
        <div class="form-field">
          <label for="bottled-product">{{ t('production.fields.product') }}</label>
          <pv-select input-id="bottled-product" v-model="form.productId" :options="props.productOptions"
                     option-label="label" option-value="value" show-clear fluid
                     :placeholder="t('production.batch-form.product-placeholder')"/>
          <small class="text-muted">{{ t('production.advance-stage.bottling-help') }}</small>
        </div>
      </template>
      <div class="form-field">
        <label for="stage-notes">{{ t('production.fields.notes') }}</label>
        <pv-textarea id="stage-notes" v-model="form.notes" rows="2" auto-resize fluid
                     :placeholder="t('production.advance-stage.notes-placeholder')"/>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" text @click="emit('update:visible', false)"/>
      <pv-button type="submit" form="advance-stage-form" icon="pi pi-check" :label="t('production.advance-stage.submit')"
                 :loading="props.saving"/>
    </template>
  </pv-dialog>
</template>
