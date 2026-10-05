<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { StockStatus } from '@/inventory-stock/domain/model/stock-item.entity.js';


const props = defineProps({ status: { type: String, required: true } });
const { t } = useI18n();

const SEVERITY_BY_STATUS = Object.freeze({
  [StockStatus.OPTIMAL]: 'success',
  [StockStatus.LOW]: 'warn',
  [StockStatus.CRITICAL]: 'danger'
});

const severity = computed(() => SEVERITY_BY_STATUS[props.status] ?? 'secondary');
</script>

<template>
  <pv-tag :value="t(`inventory.status.${props.status}`)" :severity="severity"/>
</template>
