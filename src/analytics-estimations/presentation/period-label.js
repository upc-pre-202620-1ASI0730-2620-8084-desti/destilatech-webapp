
export const formatPeriodLabel = (date, granularity, locale) => {
    if (granularity === 'month') return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
};
