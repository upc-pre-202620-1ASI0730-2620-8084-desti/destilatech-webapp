import { BaseAssembler } from '@/shared/infrastructure/base-assembler.js';
import { Plan } from '@/billing/domain/model/plan.entity.js';


export class PlanAssembler extends BaseAssembler {

    toEntityFromResource(resource) {
        return new Plan({ ...resource });
    }
}
