
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalUnblock() {
    console.log('🚀 Starting Final Assignment Unblocker (ID-based)...');

    const projectId = 'c80db9d5-1b01-4d2e-8374-9cd7c6423576';
    const workerId = '8dfa1ea5-e2ca-4038-a169-ca1b6432b217'; // Gabriel Plaiz

    // 1. Unblock Pixelz (AI Worker) capacity just in case
    await supabase.from('worker_stats').update({ max_projects_limit: 50 }).eq('worker_id', '1da97a0f-386e-4baa-a7e5-06a10709c4c9');

    // 2. Force assign the specific project
    const { error: err2 } = await supabase
        .from('projects')
        .update({
            status: 'assigned',
            worker_id: workerId,
            assignment_method: 'admin_override'
        })
        .eq('id', projectId);

    if (err2) {
        console.error('❌ Failed to assign project:', err2);
    } else {
        console.log('✅ Successfully assigned project to Gabriel Plaiz.');

        // 3. Increment worker active projects count
        await supabase.rpc('increment_worker_active_projects', { worker_id_param: workerId }).catch(() => { });
    }

    console.log('🚀 Unblocker task complete.');
}

finalUnblock();
