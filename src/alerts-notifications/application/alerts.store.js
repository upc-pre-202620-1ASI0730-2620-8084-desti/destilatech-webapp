import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { AlertsApi } from '@/alerts-notifications/infrastructure/alerts-api.js';
import { AlertAssembler } from '@/alerts-notifications/infrastructure/alert.assembler.js';
import { Alert } from '@/alerts-notifications/domain/model/alert.entity.js';
import { useUserStore } from '@/shared/application/user.store.js';

const alertsApi = new AlertsApi();
const alertAssembler = new AlertAssembler();


export const useAlertsStore = defineStore('alerts', () => {
    const alerts = ref([]);
    const errors = ref([]);
    const loading = ref(false);
    const loaded = ref(false);

    const pendingAlerts = computed(() => alerts.value.filter(alert => alert.isPending()));
    const pendingCount = computed(() => pendingAlerts.value.length);

    async function fetchAlerts() {
        const userStore = useUserStore
();
        if (!userStore.currentUserId) return;
        errors.value = [];
        loading.value = true;
        try {
            const response = await alertsApi.getAlertsByUserId(userStore.currentUserId);
            alerts.value = alertAssembler.toEntitiesFromResponse(response);
            loaded.value = true;
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    async function raiseAlert(command) {
        if (!loaded.value) await fetchAlerts();
        if (alerts.value.some(alert => alert.isPendingFor(command.type, command.sourceId))) return null;
        try {
            const alert = new Alert({ ...command });
            const response = await alertsApi.createAlert(alertAssembler.toResourceFromEntity(alert));
            const createdAlert = alertAssembler.toEntityFromResponse(response);
            alerts.value = [createdAlert, ...alerts.value];
            return createdAlert;
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }


    async function markAsAttended(alert) {
        errors.value = [];
        try {
            alert.markAsAttended();
            await alertsApi.patchAlert(alert.id, { status: alert.status, attendedAt: alert.attendedAt.toISOString() });
            return true;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }

    function reset() {
        alerts.value = [];
        loaded.value = false;
    }

    return { alerts, errors, loading, pendingAlerts, pendingCount, fetchAlerts, raiseAlert, markAsAttended, reset };
});
