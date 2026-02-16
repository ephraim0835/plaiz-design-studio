
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceMatchExplicit() {
    const projectId = 'd8aca9a2-4d92-11ef-af19-c764eb9209a6'; // "jk"
    console.log(`🚀 Calling match_worker_to_project (EXPLICIT) for: ${projectId}...`);

    // Using explicit parameters that match the 3-arg signature in ultra_force_pixelz.sql
    const { data: workerId, error } = await supabase.rpc('match_worker_to_project', {
        p_skill: 'web',
        p_budget: 0,
        p_project_id: projectId
    });

    if (error) {
        console.error('❌ RPC Error:', error.message);
        console.log('🔄 Attempting 1-arg fallback if applicable...');
        const { data: w2, error: e2 } = await supabase.rpc('match_worker_to_project', {
            p_skill: 'web'
        });
        if (e2) console.error('❌ Fallback failed:', e2.message);
        else console.log('✅ Fallback success (but this might not assign existing project):', w2);
    } else {
        console.log(`✅ Success! Worker ID Assigned: ${workerId}`);
    }
}

forceMatchExplicit();
