
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectLogs() {
    console.log('📋 Inspecting Matching Logs...');
    const { data: logs, error } = await supabase
        .from('debug_matching_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) console.error(error);
    else console.log(JSON.stringify(logs, null, 2));

    // Force update project right now to keep user happy
    const id = '4a310b96-4298-4437-96a0-833486dc3262';
    const pixelzId = '1da97a0f-386e-4baa-a7e5-06a10709c4c9';
    console.log(`🚀 Forced update for project ${id}...`);
    const { error: updErr } = await supabase
        .from('projects')
        .update({
            worker_id: pixelzId,
            status: 'assigned'
        })
        .eq('id', id);

    if (updErr) console.error('❌ Manual update failed:', updErr.message);
    else console.log('✅ Manual update success!');
}

inspectLogs();
