import { useIamStore } from '@/iam/application/iam.store.js';
import { useUserStore } from '@/shared/application/user.store.js';


/**
 * Navigation guard of the IAM bounded context.
 *
 * - Routes with `meta.public` are open. Sign in and sign up are also `meta.guestOnly`: a signed-in account goes to
 *   the dashboard instead.
 * - Any other route needs a session; without it the user goes to the sign-in page and comes back after signing in.
 * - When the free trial has ended and there is no paid plan, only the routes with `meta.allowWithoutAccess`
 *   (the subscription plans and the checkout pages) are open.
 */
export const authenticationGuard = async to => {
    const iamStore = useIamStore();
    const session = iamStore.refreshSession();

    if (to.meta['public']) {
        return session && to.meta['guestOnly'] ? { name: 'dashboard' } : true;
    }

    if (!session) {
        return { name: 'sign-in', query: { redirect: to.fullPath } };
    }

    const userStore = useUserStore();
    if (!await userStore.loadCurrentUser(session.userId)) {
        iamStore.signOut();
        return { name: 'sign-in', query: { redirect: to.fullPath } };
    }

    if (!userStore.hasActiveAccess && !to.meta['allowWithoutAccess']) {
        return { name: 'subscription-plans', query: { reason: 'trial-expired' } };
    }

    return true;
};
