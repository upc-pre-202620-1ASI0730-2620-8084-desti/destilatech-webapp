import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '@/iam/infrastructure/iam-api.js';
import { UserAssembler } from '@/iam/infrastructure/user.assembler.js';
import { SignInAssembler } from '@/iam/infrastructure/sign-in.assembler.js';
import { SignUpAssembler } from '@/iam/infrastructure/sign-up.assembler.js';
import { SignInCommand } from '@/iam/domain/model/sign-in.command.js';
import { STORAGE_KEYS } from '@/shared/infrastructure/base-api.js';

const iamApi = new IamApi();
const userAssembler = new UserAssembler();


export const useIamStore = defineStore('iam', () => {
    const currentUser = ref(null);
    const token = ref(null);
    const errors = ref([]);
    const loading = ref(false);

    const isSignedIn = computed(() => currentUser.value !== null && token.value !== null);
    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const isProducer = computed(() => currentUser.value?.isProducer() ?? false);
    const isRetailer = computed(() => currentUser.value?.isRetailer() ?? false);
    const hasActiveAccess = computed(() => currentUser.value?.hasActiveAccess() ?? false);


    function persistSession(user, sessionToken) {
        currentUser.value = user;
        token.value = sessionToken;
        localStorage.setItem(STORAGE_KEYS.token, sessionToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userAssembler.toResourceFromEntity(user)));
    }


    async function signIn(command) {
        errors.value = [];
        loading.value = true;
        try {
            const signInResource = SignInAssembler.toResourceFromResponse(await iamApi.signIn(command));
            if (!signInResource) throw new Error('invalid-credentials');
            localStorage.setItem(STORAGE_KEYS.token, signInResource.token);
            const user = userAssembler.toEntityFromResponse(await iamApi.getUserById(signInResource.id));
            persistSession(user, signInResource.token);
            return true;
        } catch (error) {
            localStorage.removeItem(STORAGE_KEYS.token);
            errors.value.push(error instanceof Error ? error.message : error);
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function signUp(command) {
        errors.value = [];
        loading.value = true;
        try {
            const signUpResource = SignUpAssembler.toResourceFromResponse(await iamApi.signUp(command));
            if (!signUpResource) throw new Error('sign-up-failed');
        } catch (error) {
            errors.value.push(error instanceof Error ? error.message : error);
            loading.value = false;
            return false;
        }
        return signIn(new SignInCommand({ email: command.email, password: command.password }));
    }


    function signOut() {
        currentUser.value = null;
        token.value = null;
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
    }


    function restoreSession() {
        const storedToken = localStorage.getItem(STORAGE_KEYS.token);
        const storedUser = localStorage.getItem(STORAGE_KEYS.user);
        if (!storedToken || !storedUser) return false;
        try {
            currentUser.value = userAssembler.toEntityFromResource(JSON.parse(storedUser));
            token.value = storedToken;
            return true;
        } catch (error) {
            console.error('Invalid stored session:', error);
            signOut();
            return false;
        }
    }


    async function updateProfile(changes) {
        if (!currentUser.value) return false;
        errors.value = [];
        try {
            const response = await iamApi.patchUser(currentUser.value.id, changes);
            persistSession(userAssembler.toEntityFromResource(response.data), token.value);
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        }
    }


    async function extendAccountAccess(until) {
        if (!currentUser.value) return;
        currentUser.value.extendAccessUntil(until);
        const response = await iamApi.patchUser(currentUser.value.id, { accessGrantedUntil: until.toISOString() });
        const { password, ...resource } = response.data;
        persistSession(userAssembler.toEntityFromResource(resource), token.value);
    }

    async function loadDemoAccount(userId = 1) {
        if (currentUser.value || restoreSession()) return;
        currentUser.value = userAssembler.toEntityFromResponse(await iamApi.getUserById(userId));
    }

    return {
        currentUser,
        token,
        errors,
        loading,
        isSignedIn,
        currentUserId,
        isProducer,
        isRetailer,
        hasActiveAccess,
        signIn,
        signUp,
        signOut,
        restoreSession,
        updateProfile,
        extendAccountAccess,
        loadDemoAccount
    };
});
