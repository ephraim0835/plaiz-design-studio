
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function surgicalRPC() {
    const projectId = 'd8aca9a2-4d92-11ef-af19-c764eb9209a6'; // "jk"
    console.log(`🚀 Attempting surgical RPC call for project: ${projectId}`);

    // We use the 3-argument version which is the most specific.
    const { data: workerId, error } = await supabase.rpc('match_worker_to_project', {
        p_skill: 'web',      // String/Text
        p_budget: 0,        // Number/Numeric
        p_project_id: projectId // UUID
    });

    if (error) {
        console.error('❌ RPC Failed:', error.message);
        console.log('💡 Note: Trying with literal types via raw fetch...');

        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/match_worker_to_project`, {
            method: 'POST',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                p_skill: 'web',
                p_budget: 0,
                p_project_id: projectId
            })
        });

        const resData = await response.json();
        if (response.ok) {
            console.log('✅ Surgical RPC success via raw fetch!', resData);
        } else {
            console.error('❌ Surgical RPC failed via raw fetch:', resData);
        }
    } else {
        console.log('✅ Surgical RPC success!', workerId);
    }
}

surgicalRPC();
