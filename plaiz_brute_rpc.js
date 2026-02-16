
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function bruteForceRPC() {
    const projectId = '63311201-2429-4fce-af19-c764eb9209a6'; // jk
    console.log(`🚀 Brute-forcing RPC for [${projectId}]...`);

    const attempts = [
        { p_skill: 'web', p_budget: 0, p_project_id: projectId },
        { p_project_id: projectId, p_skill: 'web', p_budget: 0 },
        { p_skill: 'web', p_project_id: projectId },
        { p_project_id: projectId, p_skill: 'web' },
        { p_skill: 'web' } // Just to see if it matching 1-arg
    ];

    for (const params of attempts) {
        console.log('🔹 Trying params:', JSON.stringify(params));
        const { data, error } = await supabase.rpc('match_worker_to_project', params);
        if (error) {
            console.error('❌ Failed:', error.message);
        } else {
            console.log('✅ SUCCESS!', data);

            // If success, check if assigned
            const { data: proj } = await supabase.from('projects').select('status, worker_id').eq('id', projectId).single();
            console.log('📊 Resulting status:', proj?.status, 'Worker:', proj?.worker_id);
            return;
        }
    }
}

bruteForceRPC();
