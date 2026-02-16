
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function assignCorrectID() {
    const projectId = '63311201-2429-4fce-af19-c764eb9209a6'; // CORRECT ID for "jk"
    const pixelzId = '87910103-6058-48be-8167-739c94157989';
    console.log(`🚀 Assigning correct project [${projectId}] to Pixelz [${pixelzId}]...`);

    // We first try direct update
    const { data: d1, error: e1 } = await supabase
        .from('projects')
        .update({
            worker_id: pixelzId,
            status: 'assigned',
            assigned_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select();

    if (e1) {
        console.error('❌ Direct update failed:', e1.message);
        console.log('🔄 Trying RPC fallback...');
        const { data: d2, error: e2 } = await supabase.rpc('match_worker_to_project', {
            p_skill: 'web',
            p_budget: 0,
            p_project_id: projectId
        });
        if (e2) console.error('❌ RPC fallback failed:', e2.message);
        else console.log('✅ RPC fallback success!', d2);
    } else {
        console.log('✅ Direct update success!', d1[0].status);
    }
}

assignCorrectID();
