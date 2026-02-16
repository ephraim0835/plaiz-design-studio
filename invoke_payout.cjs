const { createClient } = require('@supabase/supabase-js');
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function invoke() {
    try {
        console.log('Invoking process-payout...');
        const { data, error } = await supabase.functions.invoke('process-payout', {
            body: { payout_log_id: 'df7143ea-bae4-4a7a-902b-c6bd7f276d60' }
        });

        if (error) {
            console.log('FUNCTION_ERROR:', JSON.stringify(error, null, 2));
            // Check DB status if function failed
            const { data: payout } = await supabase.from('payout_logs').select('status').eq('id', 'df7143ea-bae4-4a7a-902b-c6bd7f276d60').single();
            console.log('DB_STATUS:', payout?.status);
        } else {
            console.log('FUNCTION_SUCCESS:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

invoke();
