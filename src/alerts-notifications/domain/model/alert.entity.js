import { DateTime } from '@/shared/domain/model/date-time.js';


export const AlertType = Object.freeze({

    LOW_STOCK: 'LOW_STOCK',

    ANOMALY: 'ANOMALY'
});


export const AlertStatus = Object.freeze({
    PENDING: 'PENDING',
    ATTENDED: 'ATTENDED'
});


export const AlertSeverity = Object.freeze({
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL'
});


/**
 * Alert raised by the platform.
 * `sourceId` is the product (low stock) or the process variable (anomaly) that caused it, and `message` is the
 * plain text sent by the server, shown when the source is no longer available.
 */
export class Alert {

    constructor({
                    id = null,
                    userId,
                    type,
                    sourceId,
                    message = '',
                    severity = AlertSeverity.WARNING,
                    status = AlertStatus.PENDING,
                    createdAt = new Date(),
                    attendedAt = null
                }) {
        if (!userId) throw new Error('Alert must belong to an account');
        if (!Object.values(AlertType).includes(type)) throw new Error(`Unsupported alert type: ${type}`);
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.sourceId = sourceId;
        this.message = message;
        this.severity = severity;
        this.status = status;
        this.createdAt = new DateTime(createdAt);
        this.attendedAt = attendedAt ? new DateTime(attendedAt) : null;
    }


    isPending() {
        return this.status === AlertStatus.PENDING;
    }


    markAsAttended() {
        if (!this.isPending()) throw new Error('Alert was already attended');
        this.status = AlertStatus.ATTENDED;
        this.attendedAt = new DateTime();
    }
}
