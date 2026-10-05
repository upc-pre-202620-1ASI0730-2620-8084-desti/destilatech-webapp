
export const MetricType = Object.freeze({
    PRODUCTION_VOLUME: 'PRODUCTION_VOLUME',
    STOCK_LEVEL: 'STOCK_LEVEL',
    STOCK_ENTRIES: 'STOCK_ENTRIES',
    STOCK_EXITS: 'STOCK_EXITS',
    SALES_VOLUME: 'SALES_VOLUME'
});


export class HistoricalIndicator {

    constructor({ metricType, periodStart, value }) {
        if (!Object.values(MetricType).includes(metricType)) throw new Error(`Unsupported metric: ${metricType}`);
        this.metricType = metricType;
        this.periodStart = periodStart;
        this.value = Math.round(value * 100) / 100;
        Object.freeze(this);
    }
}


export const bucketStart = (date, granularity) => {
    const start = new Date(date.getFullYear(), date.getMonth(), granularity === 'month' ? 1 : date.getDate());
    if (granularity === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
};


export const buildBuckets = (days, granularity, now = new Date()) => {
    const buckets = [];
    const cursor = bucketStart(new Date(now.getTime() - days * 24 * 60 * 60 * 1000), granularity);
    const end = bucketStart(now, granularity);
    while (cursor <= end) {
        buckets.push(new Date(cursor));
        if (granularity === 'month') cursor.setMonth(cursor.getMonth() + 1);
        else cursor.setDate(cursor.getDate() + (granularity === 'week' ? 7 : 1));
    }
    return buckets;
};


export const generateSumSeries = ({ metricType, records, days, granularity }) => {
    const buckets = buildBuckets(days, granularity);
    const totals = new Map(buckets.map(bucket => [bucket.getTime(), 0]));
    records.forEach(record => {
        const key = bucketStart(record.date, granularity).getTime();
        if (totals.has(key)) totals.set(key, totals.get(key) + record.value);
    });
    return buckets.map(bucket => new HistoricalIndicator({ metricType, periodStart: bucket, value: totals.get(bucket.getTime()) }));
};


export const generateStockLevelSeries = ({ currentTotal, movements, days, granularity }) => {
    const buckets = buildBuckets(days, granularity);
    const sortedMovements = [...movements].sort((first, second) => second.date - first.date);
    return buckets.map((bucket, index) => {
        const bucketEnd = index < buckets.length - 1 ? buckets[index + 1] : new Date(8.64e15);
        const laterChange = sortedMovements
            .filter(movement => movement.date >= bucketEnd)
            .reduce((sum, movement) => sum + movement.signedQuantity, 0);
        return new HistoricalIndicator({ metricType: MetricType.STOCK_LEVEL, periodStart: bucket, value: Math.max(0, currentTotal - laterChange) });
    });
};
