
export class RegisterBatchCommand {

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
