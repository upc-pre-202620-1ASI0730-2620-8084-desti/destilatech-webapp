import { sessionStorage } from '@/iam/infrastructure/session.storage.js';

const signInPath = '/login';

/**
 * Adds the access token of the signed-in account to every request to the platform API.
 * Same idea as the IAM interceptor of the course reference (learning-center), reading the token from the session.
 */
export const iamInterceptor = {
    onRequest: config => {
        const session = sessionStorage.read();
        if (session) config.headers.Authorization = `Bearer ${session.token}`;
        return config;
    },

    /**
     * A 401 means the token is missing or expired: the session is closed and the user goes back to the sign-in page.
     * The sign-in request itself is excluded, because there a 401 only means wrong credentials.
     */
    onResponseError: error => {
        const isSignIn = error.config?.url?.endsWith(import.meta.env.VITE_TOKENS_ENDPOINT_PATH);
        if (error.response?.status === 401 && !isSignIn) {
            sessionStorage.clear();
            if (window.location.pathname !== signInPath) {
                const redirect = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.assign(`${signInPath}?redirect=${redirect}&expired=1`);
            }
        }
        return Promise.reject(error);
    }
};
