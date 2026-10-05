import { useIamStore } from '@/iam/application/iam.store.js';


export const authenticationGuard = to => {
    const iamStore = useIamStore();
    if (!iamStore.isSignedIn) iamStore.restoreSession();

    const requiresAuth = to.matched.some(record => record.meta['requiresAuth']);

    if (!requiresAuth) {
        if (iamStore.isSignedIn && to.meta['guestOnly']) return { path: '/dashboard' };
        return true;
    }

    if (!iamStore.isSignedIn) return { name: 'sign-in', query: { redirect: to.fullPath } };

    const allowedBusinessTypes = to.meta['businessTypes'];
    if (allowedBusinessTypes && !allowedBusinessTypes.includes(iamStore.currentUser.businessType)) {
        return { path: '/dashboard' };
    }

    if (!iamStore.hasActiveAccess && !to.meta['allowWithoutAccess']) {
        return { path: '/billing/plans', query: { reason: 'trial-expired' } };
    }

    return true;
};
