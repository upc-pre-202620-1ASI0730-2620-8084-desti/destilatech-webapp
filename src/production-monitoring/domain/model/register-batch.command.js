/**
 * Command to register a new production batch (US06).
 */
export class RegisterBatchCommand {
    /**
     * @param {Object} props
     * @param {string} props.variety
     * @param {Date|string} props.startDate
     * @param {number} props.estimatedQuantity - Liters.
     * @param {string} [props.tank]
     * @param {number|null} [props.productId]
     * @param {string} [props.notes]
     * @throws {Error} If the start date is missing (US06 acceptance criteria) or data is invalid.
     */
    constructor({ variety = '', startDate = null, estimatedQuantity = 0, tank = '', productId = null, notes = '' }) {
        if (!startDate) throw new Error('start-date-required');
        if (!variety) throw new Error('variety-required');
        if (!(Number(estimatedQuantity) > 0)) throw new Error('quantity-required');
        this.variety = variety;
        this.startDate = startDate;
        this.estimatedQuantity = Number(estimatedQuantity);
        this.tank = tank;
        this.productId = productId;
        this.notes = notes;
    }
}
