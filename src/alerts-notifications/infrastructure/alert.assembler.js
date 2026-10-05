import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Alert } from '@/alerts-notifications/domain/model/alert.entity.js';


export class AlertAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Alert({ ...resource });
    }


    toResourceFromEntity(entity) {
        const resource = {
            userId: entity.userId,
            type: entity.type,
            sourceId: entity.sourceId,
            messageKey: entity.messageKey,
            messageParams: entity.messageParams,
            severity: entity.severity,
            status: entity.status,
            createdAt: entity.createdAt.toISOString(),
            attendedAt: entity.attendedAt ? entity.attendedAt.toISOString() : null,
            link: entity.link
        };
        if (entity.id !== null) resource.id = entity.id;
        return resource;
    }
}
