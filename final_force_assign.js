
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalForceAssign() {
    const pixelzId = '1da97a0f-386e-4baa-a7e5-06a10709c4c9';
    const projects = [
        '63311201-2429-4fce-af19-c764eb9209a6', // jk
        'd84e7018-37b5-42e0-af9d-afc29759beae'  // another queued project
    ];

    console.log(`🚀 Forcing assignment to Pixelz [${pixelzId}]...`);

    for (const projectId of projects) {
        console.log(`🔹 Processing [${projectId}]...`);
        // We try a direct update first. If that fails with schema cache, we'll try something else.
        const { data, error } = await supabase
            .from('projects')
            .update({
                worker_id: pixelzId,
                status: 'assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', projectId)
            .select();

        if (error) {
            console.error(`❌ Failed [${projectId}]: ${error.message}`);
        } else {
            console.log(`✅ Success [${projectId}]! Status: ${data[0].status}`);

            // Send system message
            await supabase.from('messages').insert({
                project_id: projectId,
                sender_id: pixelzId,
                content: 'I have been assigned to your project. Ready to start!',
                is_system_message: true
            });
        }
    }
}

finalForceAssign();
