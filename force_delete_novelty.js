
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalForceDelete() {
    const projectId = '54a7f33d-8aeb-4aca-b98a-53097cb00234';
    console.log(`🧨 FORCING DELETION of Project ID: ${projectId}`);

    const dependencyTables = [
        'messages',
        'project_files',
        'agreements',
        'project_reviews',
        'payout_logs',
        'payments',
        'notifications'
    ];

    for (const table of dependencyTables) {
        await supabase.from(table).delete().eq('project_id', projectId);
    }

    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) console.error('❌ Delete failed:', error);
    else console.log('✅ Delete call finished.');

    const { data: verify } = await supabase.from('projects').select('id').eq('id', projectId).maybeSingle();
    if (verify) console.error('❌ STILL EXISTS!');
    else console.log('✨ GONE FOR GOOD.');
}

finalForceDelete();
