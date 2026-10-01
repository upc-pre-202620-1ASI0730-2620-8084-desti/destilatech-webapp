export class BaseAssembler {
    toEntityFromResource(resource) {
        throw new Error(`${this.constructor.name}.toEntityFromResource is not implemented (${resource})`);
    }

    toResourceFromEntity(entity) {
        return { ...entity };
    }

    toEntitiesFromResponse(response) {
        const resources = Array.isArray(response.data) ? response.data : [];
        return resources.map(resource => {
            try {
                return this.toEntityFromResource(resource);
            } catch (error) {
                console.error(`${this.constructor.name} validation error:`, error.message, resource);
                return null;
            }
        }).filter(entity => entity !== null);
    }


}