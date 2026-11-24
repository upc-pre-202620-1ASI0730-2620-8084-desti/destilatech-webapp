import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { IamApi } from '@/iam/infrastructure/iam-api.js';
import { sessionStorage } from '@/iam/infrastructure/session.storage.js';
import { useUserStore } from '@/shared/application/user.store.js';

const iamApi = new IamApi();


/**
 * Application service store of the IAM bounded context: sign up, sign in and sign out.
 * Based on the IAM store of the course reference (learning-center); here the session also keeps
 * the account id and the token expiration, and the signed-in account goes to the user store.
 */
export const useIamStore = defineStore('iam', () => {
    const session = ref(sessionStorage.read());
    const errors = ref([]);
    const isSubmitting = ref(false);

    const isSignedIn = computed(() => session.value !== null);
    const currentUserId = computed(() => session.value?.userId ?? null);


    /**
     * @param {import('@/iam/domain/model/sign-in.command.js').SignInCommand} signInCommand
     * @returns {Promise<boolean>} Whether the sign-in succeeded.
     */
    async function signIn(signInCommand) {
        errors.value = [];
        isSubmitting.value = true;
        try {
            const { data } = await iamApi.signIn({ email: signInCommand.email, password: signInCommand.password });
            sessionStorage.save({ token: data.token, userId: data.user.id, expiresAt: data.expiresAt });
            session.value = sessionStorage.read();
            useUserStore().setCurrentUserFromResource(data.user);
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        } finally {
            isSubmitting.value = false;
        }
    }


    /**
     * Registers the account and signs in with it, so the free trial starts right away.
     * @param {import('@/iam/domain/model/sign-up.command.js').SignUpCommand} signUpCommand
     * @returns {Promise<boolean>} Whether the account was created and signed in.
     */
    async function signUp(signUpCommand) {
        errors.value = [];
        isSubmitting.value = true;
        try {
            await iamApi.signUp({ ...signUpCommand });
        } catch (error) {
            errors.value.push(error);
            isSubmitting.value = false;
            return false;
        }
        isSubmitting.value = false;
        return signIn({ email: signUpCommand.email, password: signUpCommand.password });
    }


    function signOut() {
        sessionStorage.clear();
        session.value = null;
        errors.value = [];
        useUserStore().clearCurrentUser();
    }


    /** Re-reads the stored session, which ends when the token expires. */
    function refreshSession() {
        session.value = sessionStorage.read();
        return session.value;
    }

    return {
        session,
        errors,
        isSubmitting,
        isSignedIn,
        currentUserId,
        signIn,
        signUp,
        signOut,
        refreshSession
    };
});
