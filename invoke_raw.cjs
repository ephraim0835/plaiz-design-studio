// Native fetch in Node 18+
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();

async function invoke() {
    try {
        const url = 'https://fxdzfxvoowioiisnuwbn.supabase.co/functions/v1/process-payout';
        console.log('Fetching:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ payout_log_id: 'df7143ea-bae4-4a7a-902b-c6bd7f276d60' })
        });

        console.log('STATUS:', response.status);
        const text = await response.text();
        console.log('BODY:', text);
    } catch (e) {
        console.error('Exception:', e);
    }
}

invoke();
