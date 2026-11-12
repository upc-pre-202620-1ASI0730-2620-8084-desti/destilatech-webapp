import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { SensorReading } from '@/production-monitoring/domain/model/sensor-reading.entity.js';
import { toUtcDate } from '@/shared/infrastructure/utc-date.js';


export class SensorReadingAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new SensorReading({ ...resource, userId: resource.tenantId, recordedAt: toUtcDate(resource.recordedAt) });
    }

    /** Body of `POST /sensor-readings`. The server decides whether the value is within range. */
    toResourceFromEntity(entity) {
        return {
            processVariableId: entity.processVariableId,
            value: entity.value,
            recordedAt: entity.recordedAt.toISOString()
        };
    }
}
