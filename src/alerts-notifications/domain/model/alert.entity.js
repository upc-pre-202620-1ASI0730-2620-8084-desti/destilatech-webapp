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


export class Alert {

    constructor({
                    id = null,
                    userId,
                    type,
                    sourceId,
                    messageKey,
                    messageParams = {},
                    severity = AlertSeverity.WARNING,
                    status = AlertStatus.PENDING,
                    createdAt = new Date(),
                    attendedAt = null,
                    link = null
                }) {
        if (!userId) throw new Error('Alert must belong to an account');
        if (!Object.values(AlertType).includes(type)) throw new Error(`Unsupported alert type: ${type}`);
        if (!messageKey) throw new Error('Alert message is required');
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.sourceId = sourceId;
        this.messageKey = messageKey;
        this.messageParams = messageParams;
        this.severity = severity;
        this.status = status;
        this.createdAt = new DateTime(createdAt);
        this.attendedAt = attendedAt ? new DateTime(attendedAt) : null;
        this.link = link;
    }


    isPending() {
        return this.status === AlertStatus.PENDING;
    }


    markAsAttended() {
        if (!this.isPending()) throw new Error('Alert was already attended');
        this.status = AlertStatus.ATTENDED;
        this.attendedAt = new DateTime();
    }


    isPendingFor(type, sourceId) {
        return this.isPending() && this.type === type && this.sourceId === sourceId;
    }
}
