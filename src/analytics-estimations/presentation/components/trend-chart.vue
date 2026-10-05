<script setup>
import { computed } from 'vue';


const props = defineProps({
  type: { type: String, default: 'bar' },
  labels: { type: Array, required: true },
  /** @type {Array<{label: string, data: number[], color?: string}>} */
  series: { type: Array, required: true },
  /** Formats values in tooltips and the Y axis. */
  valueFormatter: { type: Function, default: value => value.toLocaleString() },
  stacked: { type: Boolean, default: false },
  height: { type: String, default: '16rem' }
});

const PALETTE = ['#d99b3f', '#7a3b2e', '#2f7a4f', '#a85c3f'];
const COLOR_MUTED = '#6b5d55';
const COLOR_GRID = '#efe4d6';

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.series.map((serie, index) => {
    const color = serie.color ?? PALETTE[index % PALETTE.length];
    return {
      label: serie.label,
      data: serie.data,
      backgroundColor: props.type === 'line' ? `${color}2e` : color,
      borderColor: color,
      borderWidth: props.type === 'line' ? 2 : 0,
      borderRadius: props.type === 'bar' ? 6 : 0,
      maxBarThickness: 36,
      fill: props.type === 'line' && props.series.length === 1,
      tension: 0.35,
      pointRadius: props.type === 'line' ? 2.5 : 0
    };
  })
}));

const chartOptions = computed(() => ({
  maintainAspectRatio: false,
  plugins: {
    legend: { display: props.series.length > 1, position: 'bottom', labels: { color: COLOR_MUTED, usePointStyle: true, boxWidth: 8 } },
    tooltip: { callbacks: { label: context => `${context.dataset.label}: ${props.valueFormatter(context.parsed.y)}` } }
  },
  scales: {
    x: { stacked: props.stacked, ticks: { color: COLOR_MUTED, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } },
    y: { stacked: props.stacked, beginAtZero: true, ticks: { color: COLOR_MUTED, callback: value => props.valueFormatter(value) }, grid: { color: COLOR_GRID } }
  }
}));
</script>

<template>
  <div class="chart-container" :style="{ height: props.height }">
    <pv-chart :type="props.type" :data="chartData" :options="chartOptions" class="h-full"/>
  </div>
</template>
