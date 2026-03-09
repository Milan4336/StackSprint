export const formatCurrency = (amount: number, currency = 'USD'): string => {
    if (amount === undefined || amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

export const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
    }).format(value / 100);
};

export const formatCompactNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
};
