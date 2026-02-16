const { createClient } = require('@supabase/supabase-js');
// Suppress dotenv logs
process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    try {
        const { data, error } = await supabase
            .from('payout_logs')
            .select('*')
            .eq('id', 'df7143ea-bae4-4a7a-902b-c6bd7f276d60')
            .single();

        console.log('---START---');
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('FULL_DATA:', JSON.stringify(data, null, 2));
        }
        console.log('---END---');
    } catch (e) {
        console.error('Exception:', e);
    }
}

check();
