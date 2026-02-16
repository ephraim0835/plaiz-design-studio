
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function assignQueuedToPixelz() {
    const pixelzId = '87910103-6058-48be-8167-739c94157989';
    console.log(`🚀 Assigning all queued projects to Pixelz (${pixelzId})...`);

    // 1. Find all queued projects
    const { data: queued, error: qErr } = await supabase
        .from('projects')
        .select('id, title')
        .eq('status', 'queued');

    if (qErr) {
        console.error('❌ Error fetching queued projects:', qErr.message);
        return;
    }

    if (!queued || queued.length === 0) {
        console.log('✅ No projects are currently queued.');
        return;
    }

    console.log(`📋 Found ${queued.length} projects to assign.`);

    for (const project of queued) {
        console.log(`🔹 Assigning [${project.id}] "${project.title}"...`);
        const { error: updErr } = await supabase
            .from('projects')
            .update({
                worker_id: pixelzId,
                status: 'assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', project.id);

        if (updErr) {
            console.error(`❌ Failed to assign "${project.title}":`, updErr.message);
        } else {
            console.log(`✅ Successfully assigned "${project.title}".`);

            // Add a notification for the worker
            await supabase.from('notifications').insert({
                user_id: pixelzId,
                title: 'New Project Assigned',
                message: `You have been assigned to the project: ${project.title}`,
                type: 'project_assigned',
                project_id: project.id
            });
        }
    }
}

assignQueuedToPixelz();
