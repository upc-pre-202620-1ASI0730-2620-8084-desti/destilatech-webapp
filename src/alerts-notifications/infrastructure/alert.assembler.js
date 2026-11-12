import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Alert } from '@/alerts-notifications/domain/model/alert.entity.js';


export class AlertAssembler extends BaseAssembler {

    /** The platform names the owner of the alert `accountId`; in the web app it is the user id. */
    toEntityFromResource(resource) {
        return new Alert({ ...resource, userId: resource.accountId });
    }
}
