import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { SensorReading } from '@/production-monitoring/domain/model/sensor-reading.entity.js';


export class SensorReadingAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new SensorReading({ ...resource });
    }

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
