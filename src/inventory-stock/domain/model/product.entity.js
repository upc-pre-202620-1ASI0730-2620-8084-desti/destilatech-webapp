import { Money } from '@/shared/domain/model/money.js';


export const MeasurementUnit = Object.freeze({
    BOTTLE: 'BOTTLE',
    BOX: 'BOX',
    LITER: 'LITER',
    UNIT: 'UNIT'
});

export class Product {

    constructor({ id = null, userId, name = '', presentation = '', unit = MeasurementUnit.BOTTLE, category = '', unitPrice = 0, sku = '' }) {
        if (!userId) throw new Error('Product must belong to an account');
        if (!name.trim()) throw new Error('Product name is required');
        if (!Object.values(MeasurementUnit).includes(unit)) throw new Error(`Unsupported unit: ${unit}`);
        this.id = id;
        this.userId = userId;
        this.name = name.trim();
        this.presentation = presentation.trim();
        this.unit = unit;
        this.category = category;
        this.unitPrice = unitPrice instanceof Money ? unitPrice : new Money(unitPrice);
        this.sku = sku;
    }

    get displayName() {
        return this.presentation ? `${this.name} · ${this.presentation}` : this.name;
    }
}
