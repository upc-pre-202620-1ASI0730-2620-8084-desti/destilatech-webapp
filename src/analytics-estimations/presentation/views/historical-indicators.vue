<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAnalyticsStore } from '@/analytics-estimations/application/analytics.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useUserStore } from '@/shared/application/user.store.js';
import { Money } from '@/shared/domain/model/money.js';
import { formatPeriodLabel } from '@/analytics-estimations/presentation/period-label.js';
import PageHeader from '@/shared/presentation/components/page-header.vue';
import KpiCard from '@/shared/presentation/components/kpi-card.vue';
import EmptyState from '@/shared/presentation/components/empty-state.vue';
import TrendChart from '@/analytics-estimations/presentation/components/trend-chart.vue';


const { t, locale } = useI18n();
const analyticsStore = useAnalyticsStore();
const inventoryStore = useInventoryStore();
const userStore = useUserStore
();

const periodDays = ref(30);
const periodOptions = computed(() => [
  { value: 7, label: t('analytics.periods.7') },
  { value: 30, label: t('analytics.periods.30') },
  { value: 90, label: t('analytics.periods.90') },
  { value: 365, label: t('analytics.periods.365') }
]);

const indicators = computed(() => analyticsStore.indicatorsFor(periodDays.value));
const labels = computed(() => indicators.value.stockLevel
    .map(point => formatPeriodLabel(point.periodStart, indicators.value.granularity, locale.value)));

const sum = series => series.reduce((total, point) => total + point.value, 0);
const formatMoney = value => new Money(value).format(locale.value);
const formatUnits = value => Math.round(value).toLocaleString(locale.value);
const formatLiters = value => `${Math.round(value).toLocaleString(locale.value)} L`;

const totals = computed(() => ({
  entries: sum(indicators.value.entries),
  exits: sum(indicators.value.exits),
  sales: sum(indicators.value.sales),
  production: sum(indicators.value.production)
}));

const topProducts = computed(() => analyticsStore.topConsumedProducts(periodDays.value).map(row => ({
  ...row,
  name: inventoryStore.products.find(product => product.id === row.productId)?.displayName ?? `#${row.productId}`
})));

const hasHistory = computed(() => totals.value.entries + totals.value.exits + totals.value.sales + totals.value.production > 0);

onMounted(() => {
  analyticsStore.fetchAnalytics({ force: true });
  inventoryStore.fetchInventory();
});
</script>

<template>
  <section class="flex flex-column gap-4">
    <page-header :title="t('analytics.indicators.title')" :subtitle="t('analytics.indicators.subtitle')">
      <template #actions>
        <pv-select-button v-model="periodDays" :options="periodOptions" option-label="label" option-value="value"
                          :allow-empty="false" :aria-label="t('analytics.indicators.period')"/>
      </template>
    </page-header>

    <div class="kpi-grid">
      <kpi-card :label="t('analytics.indicators.entries')" :value="formatUnits(totals.entries)" icon="pi pi-arrow-down"
                :caption="t('analytics.indicators.units-in-period')" tone="success" :loading="analyticsStore.loading"/>
      <kpi-card :label="t('analytics.indicators.exits')" :value="formatUnits(totals.exits)" icon="pi pi-arrow-up"
                :caption="t('analytics.indicators.units-in-period')" tone="warn" :loading="analyticsStore.loading"/>
      <kpi-card :label="t('analytics.indicators.sales')" :value="formatMoney(totals.sales)" icon="pi pi-wallet"
                :caption="t('analytics.indicators.sales-caption')" :loading="analyticsStore.loading"/>
      <kpi-card v-if="userStore.isProducer" :label="t('analytics.indicators.production')" :value="formatLiters(totals.production)"
                icon="pi pi-objects-column" :caption="t('analytics.indicators.production-caption')" :loading="analyticsStore.loading"/>
    </div>

    <div v-if="!analyticsStore.loading && !hasHistory" class="surface-panel">
      <empty-state icon="pi pi-chart-line" :title="t('analytics.indicators.empty-title')"
                   :description="t('analytics.indicators.empty-description')"/>
    </div>

    <template v-else>
      <div class="content-grid">
        <div class="surface-panel">
          <h2 class="mb-3">{{ t('analytics.indicators.stock-evolution') }}</h2>
          <trend-chart type="line" :labels="labels" :value-formatter="formatUnits"
                       :series="[{ label: t('analytics.indicators.units-in-stock'), data: indicators.stockLevel.map(point => point.value), color: '#7a3b2e' }]"/>
        </div>
        <div class="surface-panel">
          <h2 class="mb-3">{{ t('analytics.indicators.top-products') }}</h2>
          <ol v-if="topProducts.length" class="top-products">
            <li v-for="row in topProducts" :key="row.productId">
              <span>{{ row.name }}</span>
              <strong>{{ formatUnits(row.units) }}</strong>
            </li>
          </ol>
          <empty-state v-else icon="pi pi-box" :title="t('analytics.indicators.no-exits')"/>
        </div>
      </div>

      <div class="grid">
        <div class="col-12 lg:col-6">
          <div class="surface-panel h-full">
            <h2 class="mb-3">{{ t('analytics.indicators.entries-vs-exits') }}</h2>
            <trend-chart :labels="labels" :value-formatter="formatUnits" :series="[
              { label: t('analytics.indicators.entries'), data: indicators.entries.map(point => point.value), color: '#2f7a4f' },
              { label: t('analytics.indicators.exits'), data: indicators.exits.map(point => point.value), color: '#d99b3f' }
            ]"/>
          </div>
        </div>
        <div class="col-12 lg:col-6">
          <div class="surface-panel h-full">
            <h2 class="mb-3">{{ t('analytics.indicators.sales-evolution') }}</h2>
            <trend-chart :labels="labels" :value-formatter="formatMoney"
                         :series="[{ label: t('analytics.indicators.sales'), data: indicators.sales.map(point => point.value) }]"/>
          </div>
        </div>
        <div v-if="userStore.isProducer" class="col-12">
          <div class="surface-panel">
            <h2 class="mb-3">{{ t('analytics.indicators.production-evolution') }}</h2>
            <trend-chart :labels="labels" :value-formatter="formatLiters"
                         :series="[{ label: t('analytics.indicators.production'), data: indicators.production.map(point => point.value), color: '#a85c3f' }]"/>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.top-products {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top-products li::marker {
  color: var(--color-accent);
  font-weight: 700;
}

.top-products li {
  padding-left: 0.25rem;
}

.top-products li > * {
  vertical-align: middle;
}

.top-products strong {
  float: right;
  color: var(--color-primary-dark);
}
</style>
