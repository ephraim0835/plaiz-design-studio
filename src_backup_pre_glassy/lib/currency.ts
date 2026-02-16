export const NGN_USD_RATE_FALLBACK = 0.00065;

export const fetchExchangeRate = async (): Promise<number> => {
    try {
        // Using a reliable public API for real-time conversion
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/NGN');
        const data = await response.json();
        return data.rates.USD || NGN_USD_RATE_FALLBACK;
    } catch (error) {
        console.error('Currency API failed, using fallback:', error);
        return NGN_USD_RATE_FALLBACK;
    }
};

export const formatCurrency = (amount: number, currency: 'NGN' | 'USD' = 'NGN'): string => {
    if (currency === 'NGN') {
        return '₦' + amount.toLocaleString();
    }
    return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const convertNGNtoUSD = (ngn: number, rate: number): number => {
    return ngn * rate;
};
