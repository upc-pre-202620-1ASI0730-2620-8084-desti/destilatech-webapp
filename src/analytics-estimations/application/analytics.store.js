import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AnalyticsApi } from '@/analytics-estimations/infrastructure/analytics-api.js';
import { AnalyticsRecordAssembler } from '@/analytics-estimations/infrastructure/analytics-record.assembler.js';
import { ReplenishmentEstimate } from '@/analytics-estimations/domain/model/replenishment-estimate.entity.js';
import {
    generateStockLevelSeries,
    generateSumSeries,
    MetricType
} from '@/analytics-estimations/domain/model/historical-indicator.entity.js';
import { useIamStore } from '@/iam/application/iam.store.js';

const analyticsApi = new AnalyticsApi();
const recordAssembler = new AnalyticsRecordAssembler();


const granularityFor = days => days <= 31 ? 'day' : days <= 120 ? 'week' : 'month';


export const useAnalyticsStore = defineStore('analytics', () => {
    const movementRecords = ref([]);
    const stockLevels = ref([]);
    const saleRecords = ref([]);
    const productionRecords = ref([]);
    const errors = ref([]);
    const loading = ref(false);
    const loaded = ref(false);

    const estimates = computed(() => new Map(stockLevels.value.map(level => [
        level.productId,
        ReplenishmentEstimate.calculate({
            productId: level.productId,
            currentQuantity: level.currentQuantity,
            lowStockThreshold: level.lowStockThreshold,
            movements: movementRecords.value.filter(record => record.productId === level.productId)
        })
    ])));


    const estimateFor = productId => estimates.value.get(Number(productId)) ?? null;

    const urgentEstimates = computed(() => [...estimates.value.values()]
        .filter(estimate => estimate.hasEnoughData)
        .sort((first, second) => first.daysUntilThreshold - second.daysUntilThreshold));

    async function fetchAnalytics({ force = false } = {}) {
        if (loaded.value && !force) return;
        const iamStore = useIamStore();
        const userId = iamStore.currentUserId;
        errors.value = [];
        loading.value = true;
        try {
            const requests = [
                analyticsApi.getStockMovementHistory(userId),
                analyticsApi.getStockLevels(userId),
                analyticsApi.getOrderHistory(userId)
            ];
            if (iamStore.isProducer) requests.push(analyticsApi.getBatchHistory(userId));
            const [movementsResponse, levelsResponse, ordersResponse, batchesResponse] = await Promise.all(requests);
            movementRecords.value = recordAssembler.toMovementRecords(movementsResponse);
            stockLevels.value = recordAssembler.toStockLevelRecords(levelsResponse);
            saleRecords.value = recordAssembler.toSaleRecords(ordersResponse);
            productionRecords.value = batchesResponse ? recordAssembler.toProductionRecords(batchesResponse) : [];
            loaded.value = true;
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    function indicatorsFor(days) {
        const granularity = granularityFor(days);
        const currentTotal = stockLevels.value.reduce((sum, level) => sum + level.currentQuantity, 0);
        const entries = movementRecords.value.filter(record => record.type === 'IN')
            .map(record => ({ date: record.date, value: record.quantity }));
        const exits = movementRecords.value.filter(record => record.type === 'OUT')
            .map(record => ({ date: record.date, value: record.quantity }));
        const sales = saleRecords.value.filter(record => !record.cancelled)
            .map(record => ({ date: record.date, value: record.total }));
        const production = productionRecords.value.map(record => ({ date: record.date, value: record.liters }));

        return {
            granularity,
            stockLevel: generateStockLevelSeries({ currentTotal, movements: movementRecords.value, days, granularity }),
            entries: generateSumSeries({ metricType: MetricType.STOCK_ENTRIES, records: entries, days, granularity }),
            exits: generateSumSeries({ metricType: MetricType.STOCK_EXITS, records: exits, days, granularity }),
            sales: generateSumSeries({ metricType: MetricType.SALES_VOLUME, records: sales, days, granularity }),
            production: generateSumSeries({ metricType: MetricType.PRODUCTION_VOLUME, records: production, days, granularity })
        };
    }


    function topConsumedProducts(days, limit = 5) {
        const since = Date.now() - days * 24 * 60 * 60 * 1000;
        const totals = new Map();
        movementRecords.value
            .filter(record => record.type === 'OUT' && record.date.getTime() >= since)
            .forEach(record => totals.set(record.productId, (totals.get(record.productId) ?? 0) + record.quantity));
        return [...totals.entries()]
            .map(([productId, units]) => ({ productId, units }))
            .sort((first, second) => second.units - first.units)
            .slice(0, limit);
    }

    return {
        errors,
        loading,
        estimates,
        urgentEstimates,
        estimateFor,
        fetchAnalytics,
        indicatorsFor,
        topConsumedProducts
    };
});
