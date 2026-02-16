import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ExchangeRate {
    rate: number;
    loading: boolean;
    error: string | null;
}

export const useExchangeRate = (): ExchangeRate & { convertToUSD: (ngn: number) => string } => {
    const [rate, setRate] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRate();
    }, []);

    const isRecent = (timestamp: string, hours: number): boolean => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hoursDiff = diff / (1000 * 60 * 60);
        return hoursDiff < hours;
    };

    const fetchRate = async () => {
        try {
            // Check if we have a cached rate (< 12 hours old)
            const { data: cached, error: cacheError } = await supabase
                .from('exchange_rates')
                .select('*')
                .eq('from_currency', 'NGN')
                .eq('to_currency', 'USD')
                .single();

            if (!cacheError && cached && isRecent(cached.updated_at, 12)) {
                setRate(cached.rate);
                setLoading(false);
                return;
            }

            // Fetch fresh rate from API
            const response = await fetch('https://api.exchangerate.host/latest?base=NGN&symbols=USD');

            if (!response.ok) {
                throw new Error('Failed to fetch exchange rate');
            }

            const data = await response.json();
            const newRate = data.rates.USD;

            // Update database
            await supabase
                .from('exchange_rates')
                .upsert({
                    from_currency: 'NGN',
                    to_currency: 'USD',
                    rate: newRate,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'from_currency,to_currency'
                });

            setRate(newRate);
            setError(null);
        } catch (err) {
            console.error('Exchange rate fetch error:', err);
            setError('Failed to fetch exchange rate');
            // Fallback rate (approximate)
            setRate(0.00062);
        } finally {
            setLoading(false);
        }
    };

    const convertToUSD = (ngn: number): string => {
        if (!ngn || isNaN(ngn)) return '0.00';
        return (ngn * rate).toFixed(2);
    };

    return { rate, loading, error, convertToUSD };
};
