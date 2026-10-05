<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProcessVariable } from '@/production-monitoring/domain/model/process-variable.entity.js';


const props = defineProps({
  variable: { type: ProcessVariable, required: true },
  readings: { type: Array, required: true }
});
const { t, locale } = useI18n();

const COLOR_PRIMARY = '#7a3b2e';
const COLOR_ACCENT = '#d99b3f';
const COLOR_DANGER = '#b3261e';
const COLOR_MUTED = '#6b5d55';
const COLOR_GRID = '#efe4d6';

const chartData = computed(() => {
  const labels = props.readings.map(reading =>
      reading.recordedAt.toDate().toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const limit = value => props.readings.map(() => value);
  return {
    labels,
    datasets: [
      {
        label: t(`production.variables.${props.variable.type}`),
        data: props.readings.map(reading => reading.value),
        borderColor: COLOR_PRIMARY,
        backgroundColor: 'rgba(217, 155, 63, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: props.readings.map(reading => reading.withinRange ? COLOR_ACCENT : COLOR_DANGER),
        pointBorderColor: props.readings.map(reading => reading.withinRange ? COLOR_ACCENT : COLOR_DANGER)
      },
      {
        label: t('production.fields.max-range'),
        data: limit(props.variable.maxRange),
        borderColor: COLOR_MUTED,
        borderDash: [6, 6],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false
      },
      {
        label: t('production.fields.min-range'),
        data: limit(props.variable.minRange),
        borderColor: COLOR_MUTED,
        borderDash: [6, 6],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false
      }
    ]
  };
});

const chartOptions = computed(() => ({
  maintainAspectRatio: false,
  animation: { duration: 250 },
  plugins: {
    legend: { position: 'bottom', labels: { color: COLOR_MUTED, usePointStyle: true, boxWidth: 8 } },
    tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.formattedValue} ${props.variable.unit}` } }
  },
  scales: {
    x: { ticks: { color: COLOR_MUTED, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } },
    y: { ticks: { color: COLOR_MUTED }, grid: { color: COLOR_GRID }, title: { display: true, text: props.variable.unit, color: COLOR_MUTED } }
  }
}));
</script>

<template>
  <div class="chart-container">
    <pv-chart type="line" :data="chartData" :options="chartOptions" class="h-full"/>
  </div>
</template>
