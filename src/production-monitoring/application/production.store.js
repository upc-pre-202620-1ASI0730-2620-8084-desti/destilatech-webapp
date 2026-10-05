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
import { useIamStore } from '@/iam/application/iam.store.js';
import { useAlertsStore } from '@/alerts-notifications/application/alerts.store.js';
import { RaiseAlertCommand } from '@/alerts-notifications/domain/model/raise-alert.command.js';
import { AlertSeverity, AlertType } from '@/alerts-notifications/domain/model/alert.entity.js';
import { useInventoryStore } from '@/inventory-stock/application/inventory.store.js';
import { MovementReason } from '@/inventory-stock/domain/model/stock-movement.entity.js';

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


    async function fetchProduction({ force = false } = {}) {
        if (loaded.value && !force) return;
        const iamStore = useIamStore();
        errors.value = [];
        loading.value = true;
        try {
            const [batchesResponse, variablesResponse, readingsResponse] = await Promise.all([
                productionApi.getBatchesByUserId(iamStore.currentUserId),
                productionApi.getProcessVariablesByUserId(iamStore.currentUserId),
                productionApi.getSensorReadingsByUserId(iamStore.currentUserId)
            ]);
            batches.value = batchAssembler.toEntitiesFromResponse(batchesResponse);
            variables.value = variableAssembler.toEntitiesFromResponse(variablesResponse);
            readings.value = readingAssembler.toEntitiesFromResponse(readingsResponse);
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
        const iamStore = useIamStore();
        errors.value = [];
        try {
            const batch = new ProductionBatch({ ...command, userId: iamStore.currentUserId, code: nextBatchCode() });
            const response = await productionApi.createBatch(batchAssembler.toResourceFromEntity(batch));
            const createdBatch = batchAssembler.toEntityFromResponse(response);
            batches.value = [createdBatch, ...batches.value];

            const createdVariables = await Promise.all(DEFAULT_BATCH_VARIABLES.map((type, index) => {
                const variable = new ProcessVariable({
                    batchId: createdBatch.id, userId: iamStore.currentUserId, type,
                    sensorId: `SNS-${createdBatch.code}-${index + 1}`
                });
                return productionApi.createProcessVariable(variableAssembler.toResourceFromEntity(variable));
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
        const snapshot = batchAssembler.toResourceFromEntity(batch);
        try {
            const newStage = batch.advanceStage(notes);
            if (newStage === BatchStage.BOTTLED) batch.registerBottling(bottledUnits, productId ?? batch.productId);
            await productionApi.updateBatch(batch.id, batchAssembler.toResourceFromEntity(batch));

            if (newStage === BatchStage.BOTTLED && batch.productId && batch.bottledUnits > 0) {
                const inventoryStore = useInventoryStore();
                await inventoryStore.addStock(batch.productId, batch.bottledUnits, MovementReason.PRODUCTION, batch.code);
            }
            return true;
        } catch (error) {
            Object.assign(batch, batchAssembler.toEntityFromResource(snapshot));
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    async function configureVariableRange(variable, minRange, maxRange) {
        errors.value = [];
        try {
            variable.configureRange(minRange, maxRange);
            await productionApi.patchProcessVariable(variable.id, { minRange: variable.minRange, maxRange: variable.maxRange });
            return true;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        }
    }


    async function recordSensorReading(variable, value) {
        try {
            const reading = SensorReading.record(variable, value);
            const response = await productionApi.createSensorReading(readingAssembler.toResourceFromEntity(reading));
            const createdReading = readingAssembler.toEntityFromResponse(response);
            readings.value = [createdReading, ...readings.value];

            if (createdReading.isAnomaly()) {
                const batch = findBatch(variable.batchId);
                const alertsStore = useAlertsStore();
                const deviation = value < variable.minRange ? variable.minRange - value : value - variable.maxRange;
                await alertsStore.raiseAlert(new RaiseAlertCommand({
                    userId: variable.userId,
                    type: AlertType.ANOMALY,
                    sourceId: variable.id,
                    messageKey: 'alerts.messages.anomaly',
                    messageParams: {
                        variableType: variable.type,
                        batch: batch?.code ?? '',
                        value: variable.formatValue(value),
                        unit: variable.unit,
                        min: variable.minRange,
                        max: variable.maxRange
                    },
                    severity: deviation > (variable.maxRange - variable.minRange) * 0.15 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
                    link: `/production/batches/${variable.batchId}`
                }));
            }
            return createdReading;
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            return null;
        }
    }


    async function simulateReadings(batchId) {
        const results = await Promise.all(variablesForBatch(batchId).map(variable => {
            const previous = latestReading(variable.id);
            return recordSensorReading(variable, sensorSimulator.generateValue(variable, previous?.value ?? null));
        }));
        return results.filter(Boolean);
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
        fetchProduction,
        registerBatch,
        advanceBatchStage,
        configureVariableRange,
        recordSensorReading,
        simulateReadings
    };
});
