<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BatchStage } from '@/production-monitoring/domain/model/batch-stage.js';


const props = defineProps({ stage: { type: String, required: true } });
const { t } = useI18n();

const SEVERITY_BY_STAGE = Object.freeze({
  [BatchStage.RECEIVED]: 'secondary',
  [BatchStage.FERMENTATION]: 'warn',
  [BatchStage.DISTILLATION]: 'danger',
  [BatchStage.RESTING]: 'info',
  [BatchStage.BOTTLED]: 'success'
});

const severity = computed(() => SEVERITY_BY_STAGE[props.stage] ?? 'secondary');
</script>

<template>
  <pv-tag :value="t(`production.stages.${props.stage}`)" :severity="severity"/>
</template>
