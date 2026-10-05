import { isValidBusinessType } from '@/iam/domain/model/business-type.js';


export const MIN_PASSWORD_LENGTH = 8;


export class SignUpCommand {

    constructor({ fullName = '', email = '', password = '', businessName = '', businessType = '', preferredPlanCode = null }) {
        if (!fullName.trim()) throw new Error('Full name is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Email must be valid');
        if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password must have at least ${MIN_PASSWORD_LENGTH} characters`);
        if (!businessName.trim()) throw new Error('Business name is required');
        if (!isValidBusinessType(businessType)) throw new Error('Business type is required');

        this.fullName = fullName.trim();
        this.email = email.trim().toLowerCase();
        this.password = password;
        this.businessName = businessName.trim();
        this.businessType = businessType;
        this.preferredPlanCode = preferredPlanCode;
    }
}
