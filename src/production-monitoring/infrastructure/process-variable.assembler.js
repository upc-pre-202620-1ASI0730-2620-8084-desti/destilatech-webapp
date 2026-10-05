import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { ProcessVariable } from '@/production-monitoring/domain/model/process-variable.entity.js';

/**
 * Maps process variable resources into {@link ProcessVariable} entities and back.
 */
export class ProcessVariableAssembler extends BaseAssembler {
    /**
     * @param {Object} resource
     * @returns {ProcessVariable}
     */
    toEntityFromResource(resource) {
        return new ProcessVariable({ ...resource });
    }

    /**
     * @param {ProcessVariable} entity
     * @returns {Object}
     */
    toResourceFromEntity(entity) {
        const resource = {
            batchId: entity.batchId,
            userId: entity.userId,
            type: entity.type,
            minRange: entity.minRange,
            maxRange: entity.maxRange,
            sensorId: entity.sensorId
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
