import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ProductionApi } from '@/production-monitoring/infrastructure/production-api.js';
import { ProductionBatchAssembler } from '@/production-monitoring/infrastructure/production-batch.assembler.js';
import { ProcessVariableAssembler } from '@/production-monitoring/infrastructure/process-variable.assembler.js';
import { SensorReadingAssembler } from '@/production-monitoring/infrastructure/sensor-reading.assembler.js';
import { IotSensorSimulator } from '@/production-monitoring/infrastructure/iot-sensor-simulator.js';
import { ProductionBatch } from '@/production-monitoring/domain/model/production-batch.entity.js';
import { DEFAULT_BATCH_VARIABLES, ProcessVariable } from '@/production-monitoring/domain/model/process-variable.entity.js';
import { SensorReading } from '@/production-monitoring/domain/model/sensor-reading.entity.js';
import { BatchStage } from '@/production-monitoring/domain/model/batch-stage.js';
import { useUserStore } from '@/shared/application/user.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';

const productionApi = new ProductionApi();
const batchAssembler = new ProductionBatchAssembler();
const variableAssembler = new ProcessVariableAssembler();
const readingAssembler = new SensorReadingAssembler();
const sensorSimulator = new IotSensorSimulator();

export const useProductionStore = defineStore('production', () => {
    const batches = ref([]);
    const variables = ref([]);
    const readings = ref([]);
    const errors = ref([]);
    const loading = ref(false);
    const loaded = ref(false);

    const activeBatches = computed(() => batches.value.filter(batch => batch.isActive()));
    const monitoredBatches = computed(() => batches.value.filter(batch => batch.isMonitored()));
    const batchesInStage = stage => batches.value.filter(batch => batch.stage === stage);

    const findBatch = batchId => batches.value.find(batch => batch.id === Number(batchId));

    const variablesForBatch = batchId => variables.value.filter(variable => variable.batchId === Number(batchId));


    const readingsForVariable = (variableId, limit = 24) => readings.value
        .filter(reading => reading.processVariableId === variableId)
        .slice(0, limit)
        .reverse();

    const latestReading = variableId => readings.value.find(reading => reading.processVariableId === variableId) ?? null;

    const anomaliesForBatch = batchId => readings.value.filter(reading => reading.batchId === Number(batchId) && reading.isAnomaly());


    /** Out of range reading of the variable closest in time to the given date (the one that raised an alert). */
    const closestAnomaly = (variableId, date) => readings.value
        .filter(reading => reading.processVariableId === variableId && reading.isAnomaly())
        .reduce((closest, reading) => !closest
            || Math.abs(reading.recordedAt.toDate() - date) < Math.abs(closest.recordedAt.toDate() - date) ? reading : closest, null);


    async function fetchProduction({ force = false } = {}) {
        if (loaded.value && !force) return;
        const userStore = useUserStore();
        errors.value = [];
        loading.value = true;
        try {
            const [batchesResponse, variablesResponse, readingsResponse] = await Promise.all([
                productionApi.getBatchesByUserId(userStore.currentUserId),
                productionApi.getProcessVariablesByUserId(userStore.currentUserId),
                productionApi.getSensorReadingsByUserId(userStore.currentUserId)
            ]);
            batches.value = batchAssembler.toEntitiesFromResponse(batchesResponse)
                .sort((first, second) => second.startDate.toDate() - first.startDate.toDate());
            variables.value = variableAssembler.toEntitiesFromResponse(variablesResponse);
            readings.value = readingAssembler.toEntitiesFromResponse(readingsResponse)
                .sort((first, second) => second.recordedAt.toDate() - first.recordedAt.toDate());
            loaded.value = true;
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value = false;
        }
    }


    function nextBatchCode() {
        const year = new Date().getFullYear();
        const prefix = `LT-${year}-`;
        const lastSequence = batches.value
            .filter(batch => batch.code.startsWith(prefix))
            .map(batch => Number(batch.code.slice(prefix.length)) || 0)
            .reduce((max, value) => Math.max(max, value), 0);
        return `${prefix}${String(lastSequence + 1).padStart(3, '0')}`;
    }


    async function registerBatch(command) {
        const userStore = useUserStore();
        errors.value = [];
        try {
            const batch = new ProductionBatch({ ...command, userId: userStore.currentUserId, code: nextBatchCode() });
            const response = await productionApi.createBatch(userStore.currentUserId, batchAssembler.toResourceFromEntity(batch));
            const createdBatch = batchAssembler.toEntityFromResponse(response);
            batches.value = [createdBatch, ...batches.value];

            const createdVariables = await Promise.all(DEFAULT_BATCH_VARIABLES.map((type, index) => {
                const variable = new ProcessVariable({
                    batchId: createdBatch.id, userId: userStore.currentUserId, type,
                    sensorId: `SNS-${createdBatch.code}-${index + 1}`
                });
                return productionApi.createProcessVariable(userStore.currentUserId, variableAssembler.toResourceFromEntity(variable));
            }));
            variables.value = [...variables.value, ...createdVariables.map(item => variableAssembler.toEntityFromResponse(item))];
            return createdBatch;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function advanceBatchStage(batch, { notes = '', bottledUnits = 0, productId = null } = {}) {
        errors.value = [];
        try {
            const newStage = batch.nextStage;
            if (!newStage) throw new Error('Batch is already bottled');
            const bottling = newStage === BatchStage.BOTTLED;
            const response = await productionApi.advanceBatchStage(batch.userId, batch.id, {
                stage: newStage,
                notes,
                productId: bottling ? (productId ?? batch.productId) : null,
                bottledUnits: bottling ? Number(bottledUnits) : 0
            });
            Object.assign(batch, batchAssembler.toEntityFromResponse(response));

            // The platform adds the bottled units to the stock of the product.
            if (bottling) await useInventoryStore().fetchInventory({ force: true });
            return true;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    async function configureVariableRange(variable, minRange, maxRange) {
        errors.value = [];
        const previous = { minRange: variable.minRange, maxRange: variable.maxRange };
        try {
            variable.configureRange(minRange, maxRange);
            await productionApi.configureVariableRange(variable.userId, variable.id, variable.minRange, variable.maxRange);
            return true;
        } catch (error) {
            Object.assign(variable, previous);
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    async function recordSensorReading(variable, value) {
        try {
            const reading = SensorReading.record(variable, value);
            const response = await productionApi.createSensorReading(variable.userId, readingAssembler.toResourceFromEntity(reading));
            const createdReading = readingAssembler.toEntityFromResponse(response);
            readings.value = [createdReading, ...readings.value];
            return createdReading;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function simulateReadings(batchId) {
        const results = (await Promise.all(variablesForBatch(batchId).map(variable => {
            const previous = latestReading(variable.id);
            return recordSensorReading(variable, sensorSimulator.generateValue(variable, previous?.value ?? null));
        }))).filter(Boolean);

        // Out of range readings raise an alert on the platform.
        if (results.some(reading => reading.isAnomaly())) await useAlertsStore().fetchAlerts();
        return results;
    }

    return {
        batches,
        variables,
        readings,
        errors,
        loading,
        activeBatches,
        monitoredBatches,
        batchesInStage,
        findBatch,
        variablesForBatch,
        readingsForVariable,
        latestReading,
        anomaliesForBatch,
        closestAnomaly,
        fetchProduction,
        registerBatch,
        advanceBatchStage,
        configureVariableRange,
        recordSensorReading,
        simulateReadings
    };
});
