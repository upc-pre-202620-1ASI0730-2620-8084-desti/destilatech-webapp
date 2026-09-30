
export class DateTime {
    #date;

    constructor(value = new Date()) {
        const date = value instanceof DateTime ? value.toDate() : new Date(value);
        if (isNaN(date.getTime())) throw new Error('Invalid date-time value');
        this.#date = date;
        Object.freeze(this);
    }

    isFuture() {
        return this.#date > new Date();
    }


    daysFromNow() {
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        return Math.ceil((this.#date.getTime() - Date.now()) / millisecondsPerDay);
    }


    plusDays(days) {
        const shifted = new Date(this.#date.getTime());
        shifted.setDate(shifted.getDate() + days);
        return new DateTime(shifted);
    }

    format(locale = 'es-PE', options = { year: 'numeric', month: 'short', day: '2-digit' }) {
        return this.#date.toLocaleDateString(locale, options);
    }


    formatWithTime(locale = 'es-PE') {
        return this.#date.toLocaleString(locale, {
            year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    }

    toDate() {
        return new Date(this.#date.getTime());
    }

    toISOString() {
        return this.#date.toISOString();
    }

    valueOf() {
        return this.#date.getTime();
    }
}
