import { isValidBusinessType } from '@/shared/domain/model/business-type.js';

export const MINIMUM_PASSWORD_LENGTH = 8;
export const PLAN_CODES = Object.freeze(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']);


/**
 * Command to register an account. The 14-day free trial starts with the registration.
 */
export class SignUpCommand {
    constructor({ fullName = '', email = '', password = '', businessName = '', businessType = '', preferredPlanCode = null }) {
        if (!fullName.trim()) throw new Error('The full name is required');
        if (!email.includes('@')) throw new Error('The email must be valid');
        if (password.length < MINIMUM_PASSWORD_LENGTH) {
            throw new Error(`The password must have at least ${MINIMUM_PASSWORD_LENGTH} characters`);
        }
        if (!businessName.trim()) throw new Error('The business name is required');
        if (!isValidBusinessType(businessType)) throw new Error(`Unsupported business type: ${businessType}`);

        const planCode = preferredPlanCode?.toUpperCase() ?? null;
        this.fullName = fullName.trim();
        this.email = email.trim().toLowerCase();
        this.password = password;
        this.businessName = businessName.trim();
        this.businessType = businessType;
        this.preferredPlanCode = PLAN_CODES.includes(planCode) ? planCode : null;
    }
}
