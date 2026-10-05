<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';


const props = defineProps({
  status: { type: String, required: true },
  namespace: { type: String, default: 'orders.status' }
});
const { t } = useI18n();

const SEVERITY_BY_STATUS = Object.freeze({
  PENDING: 'warn',
  PREPARING: 'info',
  SHIPPED: 'contrast',
  DELIVERED: 'success',
  CANCELLED: 'secondary',
  REQUESTED: 'warn',
  RECEIVED: 'success'
});

const severity = computed(() => SEVERITY_BY_STATUS[props.status] ?? 'secondary');
</script>

<template>
  <pv-tag :value="t(`${props.namespace}.${props.status}`)" :severity="severity"/>
</template>
