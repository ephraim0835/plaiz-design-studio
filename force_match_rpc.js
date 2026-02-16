
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceMatch() {
    const projectId = 'd8aca9a2-4d92-11ef-af19-c764eb9209a6'; // "jk"
    console.log(`🚀 Calling match_worker_to_project for: ${projectId}...`);

    const { data: workerId, error } = await supabase.rpc('match_worker_to_project', {
        p_skill: null,
        p_budget: 0,
        p_project_id: projectId
    });

    if (error) {
        console.error('❌ RPC Error:', error.message);
    } else {
        console.log(`✅ Success! Worker ID Assigned: ${workerId}`);
    }
}

forceMatch();
