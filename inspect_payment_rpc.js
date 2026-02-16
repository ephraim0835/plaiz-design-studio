
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectDatabase() {
    console.log('🔍 Querying function signature for process_client_payment_success...');

    // Query pg_proc
    const { data: functions, error: fErr } = await supabase.rpc('get_function_signature', { f_name: 'process_client_payment_success' });

    // If get_function_signature doesn't exist (likely), we might have to be creative or assume based on errors.
    // Wait, I can't run raw SQL. I have to rely on rpc name discovery.

    // Let's try to call it with 5 args and see the error message from Supabase-js
    console.log('🧪 Testing 5-arg signature...');
    const { data: res5, error: err5 } = await supabase.rpc('process_client_payment_success', {
        p_project_id: '4a310b96-4298-4437-96a0-833486dc3262',
        p_client_id: '8dfa1ea1-8314-49c9-ae51-d41982b6493c',
        p_transaction_ref: 'SIG_CHECK_5',
        p_amount: 1,
        p_phase: 'deposit_40'
    });

    if (err5) {
        console.log('❌ 5-arg failed:', err5.message);
        console.log('Details:', err5.details);
    } else {
        console.log('✅ 5-arg success!');
    }

    console.log('🧪 Testing 4-arg signature...');
    const { data: res4, error: err4 } = await supabase.rpc('process_client_payment_success', {
        p_project_id: '4a310b96-4298-4437-96a0-833486dc3262',
        p_client_id: '8dfa1ea1-8314-49c9-ae51-d41982b6493c',
        p_transaction_ref: 'SIG_CHECK_4',
        p_amount: 1
    });

    if (err4) {
        console.log('❌ 4-arg failed:', err4.message);
        console.log('Details:', err4.details);
    } else {
        console.log('✅ 4-arg success!');
    }
}

inspectDatabase();
