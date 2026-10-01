export class BaseAssembler {
    toEntityFromResource(resource) {
        throw new Error(`${this.constructor.name}.toEntityFromResource is not implemented (${resource})`);
    }

    toResourceFromEntity(entity) {
        return { ...entity };
    }


}