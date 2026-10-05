import { DateTime } from '@/shared/domain/model/date-time.js';

export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_WARNING_DAYS = 3;
export class TrialPeriod {

    constructor({ startDate, endDate }) {
        this.startDate = new DateTime(startDate);
        this.endDate = new DateTime(endDate);
        if (this.endDate.valueOf() < this.startDate.valueOf()) {
            throw new Error('Trial period end date cannot be before its start date');
        }
    }


    daysRemaining() {
        return Math.max(0, this.endDate.daysFromNow());
    }


    isExpired() {
        return !this.endDate.isFuture();
    }


    isExpiringSoon() {
        return !this.isExpired() && this.daysRemaining() <= TRIAL_WARNING_DAYS;
    }
}
