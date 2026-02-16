
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function monitorAssignment() {
    const projectId = '63311201-2429-4fce-af19-c764eb9209a6'; // jk
    const pixelzId = '1da97a0f-386e-4baa-af6f-08e1e793910c';

    console.log(`🚀 Starting assignment monitoring for [${projectId}]...`);

    // 1. Assign
    console.log('🔹 Call match_worker_to_project...');
    const { data: workerId, error } = await supabase.rpc('match_worker_to_project', {
        p_skill: 'web',
        p_project_id: projectId
    });

    if (error) {
        console.error('❌ RPC Error:', error.message);
        return;
    }

    console.log(`✅ RPC returned worker: ${workerId}`);

    // 2. Poll status for 5 seconds
    console.log('⏱ Polling status for 5 seconds...');
    for (let i = 0; i < 5; i++) {
        const { data: p } = await supabase.from('projects').select('status, worker_id').eq('id', projectId).single();
        console.log(`   [T+${i}s] Status: ${p?.status} | Worker: ${p?.worker_id}`);
        await new Promise(r => setTimeout(r, 1000));
    }
}

monitorAssignment();
