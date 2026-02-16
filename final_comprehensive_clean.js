
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalClean() {
    const ids = [
        '54a7f33d-8aeb-4aca-b98a-53097cb00234',
        '54a7f33d-8aeb-4aca-b942-1c70d44df600'
    ];
    console.log(`🧨 TOTAL CLEANUP for IDs: ${ids.join(', ')}`);

    const tables = ['messages', 'project_files', 'agreements', 'project_reviews', 'payout_logs', 'payments', 'notifications'];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().in('project_id', ids);
        if (error) console.log(`⚠️ ${table}: ${error.message}`);
        else console.log(`✅ ${table} cleaned.`);
    }

    const { error: pErr } = await supabase.from('projects').delete().in('id', ids);
    if (pErr) console.error('❌ Project delete failed:', pErr);
    else console.log('✅ Projects deleted.');

    // Final check
    const { data } = await supabase.from('projects').select('id, title').in('id', ids);
    if (data && data.length > 0) console.error('💀 SOME STILL EXIST:', data);
    else console.log('✨ CLEANUP COMPLETE. ALL GONE.');
}

finalClean();
