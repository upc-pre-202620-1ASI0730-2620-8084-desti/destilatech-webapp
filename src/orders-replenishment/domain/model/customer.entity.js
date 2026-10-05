
export const CustomerType = Object.freeze({
    LIQUOR_STORE: 'LIQUOR_STORE',
    DISTRIBUTOR: 'DISTRIBUTOR',
    RESTAURANT: 'RESTAURANT',
    MARKET: 'MARKET',
    FINAL_CONSUMER: 'FINAL_CONSUMER'
});

export class Customer {

    constructor({ id = null, userId, name = '', contactName = '', phone = '', email = '', address = '', customerType = CustomerType.LIQUOR_STORE }) {
        if (!userId) throw new Error('Customer must belong to an account');
        if (!name.trim()) throw new Error('Customer name is required');
        if (!phone.trim() && !email.trim()) throw new Error('contact-required');
        this.id = id;
        this.userId = userId;
        this.name = name.trim();
        this.contactName = contactName.trim();
        this.phone = phone.trim();
        this.email = email.trim();
        this.address = address.trim();
        this.customerType = customerType;
    }
}
