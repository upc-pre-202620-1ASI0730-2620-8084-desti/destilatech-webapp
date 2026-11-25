import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UsersApi } from '@/shared/infrastructure/users-api.js';
import { UserAssembler } from '@/shared/infrastructure/user.assembler.js';

const usersApi = new UsersApi();
const userAssembler = new UserAssembler();


/**
 * The signed-in account (the tenant) that every bounded context uses to read and write its data.
 * The IAM store opens the session; this store keeps the account and its free trial up to date.
 */
export const useUserStore = defineStore('user', () => {
    const currentUser = ref(null);
    const errors = ref([]);

    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const isProducer = computed(() => currentUser.value?.isProducer() ?? false);
    const isRetailer = computed(() => currentUser.value?.isRetailer() ?? false);
    const hasActiveAccess = computed(() => currentUser.value?.hasActiveAccess() ?? false);


    /** Sets the account returned by the sign-in, without a new request. */
    function setCurrentUserFromResource(resource) {
        currentUser.value = userAssembler.toEntityFromResource(resource);
    }


    /**
     * Loads the account of the session, for example after a page reload.
     * @returns {Promise<boolean>} Whether the account could be loaded.
     */
    async function loadCurrentUser(userId) {
        if (currentUser.value?.id === userId) return true;
        errors.value = [];
        try {
            currentUser.value = userAssembler.toEntityFromResponse(await usersApi.getUserById(userId));
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        }
    }


    /**
     * Reloads the current user from the platform, for example after a payment grants paid access.
     */
    async function refreshCurrentUser() {
        if (!currentUser.value) return;
        try {
            currentUser.value = userAssembler.toEntityFromResponse(await usersApi.getUserById(currentUser.value.id));
        } catch (error) {
            errors.value.push(error);
        }
    }


    function clearCurrentUser() {
        currentUser.value = null;
    }

    return {
        currentUser,
        errors,
        currentUserId,
        isProducer,
        isRetailer,
        hasActiveAccess,
        setCurrentUserFromResource,
        loadCurrentUser,
        refreshCurrentUser,
        clearCurrentUser
    };
});
