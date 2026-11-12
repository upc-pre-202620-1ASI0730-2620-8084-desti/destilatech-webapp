import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { ProcessVariable } from '@/production-monitoring/domain/model/process-variable.entity.js';


export class ProcessVariableAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new ProcessVariable({ ...resource, userId: resource.tenantId, minRange: Number(resource.minRange), maxRange: Number(resource.maxRange) });
    }


    /** Body of `POST /process-variables`. */
    toResourceFromEntity(entity) {
        return {
            batchId: entity.batchId,
            type: entity.type,
            minRange: entity.minRange,
            maxRange: entity.maxRange,
            sensorId: entity.sensorId
        };
    }
}
