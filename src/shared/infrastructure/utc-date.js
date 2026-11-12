/**
 * Some platform dates are stored as UTC without a time zone (for example `2026-11-12T15:30:00`).
 * JavaScript would read them as local time, so the missing `Z` is added before parsing.
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export const toUtcDate = value => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
    return new Date(hasZone ? value : `${value}Z`);
};
