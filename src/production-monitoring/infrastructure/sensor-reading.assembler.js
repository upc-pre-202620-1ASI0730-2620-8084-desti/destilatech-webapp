import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { SensorReading } from '@/production-monitoring/domain/model/sensor-reading.entity.js';

/**
 * Maps sensor reading resources into {@link SensorReading} entities and back.
 */
export class SensorReadingAssembler extends BaseAssembler {
    /**
     * @param {Object} resource
     * @returns {SensorReading}
     */
    toEntityFromResource(resource) {
        return new SensorReading({ ...resource });
    }

    /**
     * @param {SensorReading} entity
     * @returns {Object}
     */
    toResourceFromEntity(entity) {
        const resource = {
            processVariableId: entity.processVariableId,
            batchId: entity.batchId,
            userId: entity.userId,
            value: entity.value,
            withinRange: entity.withinRange,
            recordedAt: entity.recordedAt.toISOString()
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
