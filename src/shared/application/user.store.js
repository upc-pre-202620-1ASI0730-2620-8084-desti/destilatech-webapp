import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { UsersApi } from '@/shared/infrastructure/users-api.js';
import { UserAssembler } from '@/shared/infrastructure/user.assembler.js';
import { STORAGE_KEYS } from '@/shared/infrastructure/base-api.js';

const usersApi = new UsersApi();
const userAssembler = new UserAssembler();


export const useUserStore = defineStore('user', () => {
    const users = ref([]);
    const currentUser = ref(null);
    const errors = ref([]);

    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const isProducer = computed(() => currentUser.value?.isProducer() ?? false);
    const isRetailer = computed(() => currentUser.value?.isRetailer() ?? false);
    const hasActiveAccess = computed(() => currentUser.value?.hasActiveAccess() ?? false);


    async function fetchUsers() {
        if (users.value.length > 0) return;
        errors.value = [];
        try {
            users.value = userAssembler.toEntitiesFromResponse(await usersApi.getUsers());
            const storedUserId = Number(localStorage.getItem(STORAGE_KEYS.userId));
            currentUser.value = users.value.find(user => user.id === storedUserId) ?? users.value[0] ?? null;
        } catch (error) {
            errors.value.push(error);
        }
    }


    function selectUser(userId) {
        const user = users.value.find(item => item.id === userId);
        if (!user) return;
        currentUser.value = user;
        localStorage.setItem(STORAGE_KEYS.userId, String(userId));
    }


    async function extendAccountAccess(until) {
        if (!currentUser.value) return;
        currentUser.value.extendAccessUntil(until);
        await usersApi.patchUser(currentUser.value.id, { accessGrantedUntil: until.toISOString() });
    }

    return {
        users,
        currentUser,
        errors,
        currentUserId,
        isProducer,
        isRetailer,
        hasActiveAccess,
        fetchUsers,
        selectUser,
        extendAccountAccess
    };
});
