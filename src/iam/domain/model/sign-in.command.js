
export class SignInCommand {

    constructor({ email = '', password = '' }) {
        if (!email.trim()) throw new Error('Email is required');
        if (!password) throw new Error('Password is required');
        this.email = email.trim().toLowerCase();
        this.password = password;
    }
}
