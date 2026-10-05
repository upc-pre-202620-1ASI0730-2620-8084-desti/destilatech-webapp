export const BusinessType = Object.freeze({
    PRODUCER: 'PRODUCER',
    RETAILER: 'RETAILER'
});

export const isValidBusinessType = value => Object.values(BusinessType).includes(value);
