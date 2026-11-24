/**
 * Keeps the IAM session (access token, account id and expiration) in the browser storage,
 * so the session survives a page reload and the return from Stripe Checkout.
 */
const SESSION_KEY = 'destilatech.session';

export const sessionStorage = {

    /** @returns {{ token: string, userId: number, expiresAt: string } | null} The stored session, if it has not expired. */
    read() {
        try {
            const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
            if (!session?.token || new Date(session.expiresAt).getTime() <= Date.now()) return null;
            return session;
        } catch {
            return null;
        }
    },

    save({ token, userId, expiresAt }) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ token, userId, expiresAt }));
    },

    clear() {
        localStorage.removeItem(SESSION_KEY);
    }
};
