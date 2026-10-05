import { AlertSeverity, AlertType } from '@/alerts-notifications/domain/model/alert.entity.js';

export class RaiseAlertCommand {

    constructor({ userId, type, sourceId, messageKey, messageParams = {}, severity = AlertSeverity.WARNING, link = null }) {
        if (!Object.values(AlertType).includes(type)) throw new Error(`Unsupported alert type: ${type}`);
        this.userId = userId;
        this.type = type;
        this.sourceId = sourceId;
        this.messageKey = messageKey;
        this.messageParams = messageParams;
        this.severity = severity;
        this.link = link;
    }
}
