
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function surgicalMatch() {
    const projectId = 'd8aca9a2-4d92-11ef-af19-c764eb9209a6';
    console.log(`🚀 Surgical match for "${projectId}"...`);

    // We use the 3-arg signature specifically
    const { data: workerId, error } = await supabase.rpc('match_worker_to_project', {
        p_skill: 'graphics', // Explicit text
        p_budget: 0,        // Explicit numeric
        p_project_id: projectId // Explicit uuid
    });

    if (error) {
        console.error('❌ RPC Error:', error.message);
        // If it still says "best candidate", we might have a name mismatch or the DB is truly stuck
    } else {
        console.log(`✅ Success! Pixelz Assigned: ${workerId}`);
    }
}

surgicalMatch();
