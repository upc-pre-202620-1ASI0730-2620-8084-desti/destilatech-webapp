/**
 * Command to sign in with the email and the password of an account.
 */
export class SignInCommand {
    constructor({ email = '', password = '' }) {
        if (!email.trim()) throw new Error('The email is required');
        if (!password) throw new Error('The password is required');

        this.email = email.trim().toLowerCase();
        this.password = password;
    }
}
