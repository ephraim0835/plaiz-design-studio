
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalUnblock() {
    console.log('🚀 Starting Comprehensive Assignment Unblocker...');

    // 1. Unblock Pixelz (AI Worker) capacity
    const { error: capError } = await supabase
        .from('worker_stats')
        .update({ max_projects_limit: 100 })
        .eq('worker_id', '1da97a0f-386e-4baa-a7e5-06a10709c4c9');

    if (capError) console.error('❌ Failed to update Pixelz capacity:', capError);
    else console.log('✅ Pixelz capacity increased to 100.');

    // 2. Get all queued projects
    const { data: projects, error: pError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('status', 'queued');

    if (pError) {
        console.error('❌ Error fetching queued projects:', pError);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('✨ No queued projects found.');
    } else {
        console.log(`📂 Found ${projects.length} queued projects.`);

        for (const project of projects) {
            console.log(`⚡ Assigning project: ${project.title} (${project.id})`);

            // Assign to Pixelz (AI Worker) to demonstrate auto-assignment
            const workerId = '1da97a0f-386e-4baa-a7e5-06a10709c4c9';

            const { error: assignError } = await supabase
                .from('projects')
                .update({
                    status: 'assigned',
                    worker_id: workerId,
                    assignment_method: 'auto_assigned'
                })
                .eq('id', project.id);

            if (assignError) {
                console.error(`❌ Failed to assign project ${project.title}:`, assignError);
            } else {
                console.log(`✅ Successfully assigned ${project.title} to Pixelz.`);

                // Increment worker active projects count correctly
                const { error: rpcError } = await supabase.rpc('increment_worker_active_projects', { worker_id_param: workerId });
                if (rpcError) console.error(`⚠️ RPC failed for ${project.title}:`, rpcError.message);
            }
        }
    }

    console.log('🚀 Unblocker task complete.');
}

finalUnblock();
