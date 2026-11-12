import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AlertsApi } from '@/alerts-notifications/infrastructure/alerts-api.js';
import { AlertAssembler } from '@/alerts-notifications/infrastructure/alert.assembler.js';
import { AlertType } from '@/alerts-notifications/domain/model/alert.entity.js';
import { useUserStore } from '@/shared/application/user.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { useProductionStore } from '@/production-monitoring/application/production.store.js';

const alertsApi = new AlertsApi();
const alertAssembler = new AlertAssembler();


export const useAlertsStore = defineStore('alerts', () => {
    const alerts = ref([]);
    const errors = ref([]);
    const loading = ref(false);

    const pendingAlerts = computed(() => alerts.value.filter(alert => alert.isPending()));
    const pendingCount = computed(() => pendingAlerts.value.length);

    async function fetchAlerts() {
        const userStore = useUserStore();
        if (!userStore.currentUserId) return;
        errors.value = [];
        loading.value = alerts.value.length === 0;
        try {
            const response = await alertsApi.getAlertsByAccountId(userStore.currentUserId);
            alerts.value = alertAssembler.toEntitiesFromResponse(response)
                .sort((first, second) => second.createdAt.toDate() - first.createdAt.toDate());
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    /** Loads the products and batches the alerts point to, so each alert can be described by name. */
    async function fetchAlertSources() {
        const userStore = useUserStore();
        const requests = [useInventoryStore().fetchInventory()];
        if (userStore.isProducer) requests.push(useProductionStore().fetchProduction());
        await Promise.all(requests);
    }


    /**
     * Builds the translatable text and the link of an alert from its source (product or process variable).
     * When the source is not loaded, `key` is null and the view shows the server message.
     * @returns {{ key: string|null, params: object, link: string|null }}
     */
    function describe(alert) {
        if (alert.type === AlertType.LOW_STOCK) {
            const item = useInventoryStore().findInventoryItem(alert.sourceId);
            if (!item) return { key: null, params: {}, link: null };
            return {
                key: 'alerts.messages.low-stock',
                params: {
                    product: item.product.displayName,
                    quantity: item.stockItem.currentQuantity,
                    threshold: item.stockItem.lowStockThreshold
                },
                link: `/inventory/products/${item.product.id}`
            };
        }

        const productionStore = useProductionStore();
        const variable = productionStore.variables.find(item => item.id === alert.sourceId);
        if (!variable) return { key: null, params: {}, link: null };
        const batch = productionStore.findBatch(variable.batchId);
        const reading = productionStore.closestAnomaly(variable.id, alert.createdAt.toDate());
        return {
            key: 'alerts.messages.anomaly',
            params: {
                variableType: variable.type,
                batch: batch?.code ?? '',
                value: reading ? variable.formatValue(reading.value) : '—',
                unit: variable.unit,
                min: variable.minRange,
                max: variable.maxRange
            },
            link: `/production/batches/${variable.batchId}`
        };
    }


    async function markAsAttended(alert) {
        errors.value = [];
        try {
            await alertsApi.markAlertAsAttended(alert.id);
            alert.markAsAttended();
            return true;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    async function markAllAsAttended(alertsToAttend) {
        errors.value = [];
        let attended = 0;
        for (const alert of alertsToAttend.filter(alert => alert.isPending())) {
            if (await markAsAttended(alert)) attended++;
        }
        return attended;
    }

    function reset() {
        alerts.value = [];
    }

    return {
        alerts,
        errors,
        loading,
        pendingAlerts,
        pendingCount,
        fetchAlerts,
        fetchAlertSources,
        describe,
        markAsAttended,
        markAllAsAttended,
        reset
    };
});
