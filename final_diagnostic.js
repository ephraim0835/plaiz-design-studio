
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalDiagnostic() {
    console.log('🔍 Identifying "novelty" project...');
    const { data: projects } = await supabase.from('projects').select('*').ilike('title', '%novelty%');

    if (!projects || projects.length === 0) {
        console.error('❌ Project not found.');
        return;
    }

    const p = projects[0];
    const id = p.id;
    console.log(`✅ Found: ${p.title} (${id}) - Status: ${p.status}`);

    const pixelzId = '1da97a0f-386e-4baa-a7e5-06a10709c4c9';

    // 1. Try a very simple update
    console.log('🚀 Updating status to assigned...');
    const { error: updErr } = await supabase
        .from('projects')
        .update({ status: 'assigned', worker_id: pixelzId })
        .eq('id', id);

    if (updErr) console.error('❌ Update Error:', updErr.message);
    else console.log('✅ Update call reported success.');

    // 2. Immediate Check
    const { data: check1 } = await supabase.from('projects').select('*').eq('id', id).single();
    console.log(`📋 Post-Update Check: Status is ${check1?.status}, Worker is ${check1?.worker_id}`);

    // LOGS check
    const { data: debugLogs } = await supabase.from('debug_matching_logs').select('*').order('created_at', { ascending: false }).limit(3);
    console.log('📋 Recent Debug Logs:', JSON.stringify(debugLogs, null, 2));
}

finalDiagnostic();
