import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { ProcessVariable } from '@/production-monitoring/domain/model/process-variable.entity.js';


export class ProcessVariableAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new ProcessVariable({ ...resource });
    }


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
