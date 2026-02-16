
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function positionalRPC() {
    const projectId = 'd8aca9a2-4d92-11ef-af19-c764eb9209a6'; // "jk"
    console.log(`🚀 Attempting POSITIONAL RPC call for project: ${projectId}`);

    // PostgREST supports positional arguments via a POST body with "args"
    // { "args": ["web", 0, "uuid"] }
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/match_worker_to_project`, {
        method: 'POST',
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            args: ["web", 0, projectId]
        })
    });

    const resData = await response.json();
    if (response.ok) {
        console.log('✅ Positional RPC success!', resData);
    } else {
        console.error('❌ Positional RPC failed:', resData);
        // If it fails, maybe try [projectId, "web", 0] for the other signature
        console.log('🔄 Trying the other positional order (project_id first)...');
        const r2 = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/match_worker_to_project`, {
            method: 'POST',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                args: [projectId, "web", 0]
            })
        });
        const d2 = await r2.json();
        if (r2.ok) console.log('✅ Success on second order!', d2);
        else console.error('❌ Both orders failed:', d2);
    }
}

positionalRPC();
