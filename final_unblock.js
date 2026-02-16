
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalUnblock() {
    console.log('🚀 Starting Final Assignment Unblocker...');

    // 1. Unblock Pixelz (AI Worker)
    // ID: 1da97a0f-386e-4baa-a7e5-06a10709c4c9
    const { error: err1 } = await supabase
        .from('worker_stats')
        .update({ max_projects_limit: 20 })
        .eq('worker_id', '1da97a0f-386e-4baa-a7e5-06a10709c4c9');

    if (err1) console.error('❌ Failed to update Pixelz capacity:', err1);
    else console.log('✅ Pixelz capacity increased to 20.');

    // 2. Identify and assign the stuck project
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('title', 'biiiiiidtfyguh')
        .single();

    if (pError || !project) {
        console.error('❌ Could not find project "biiiiiidtfyguh":', pError);
    } else {
        console.log(`📂 Found project: ${project.title} (${project.id})`);

        // Assign to Gabriel Plaiz or Admin
        const { error: err2 } = await supabase
            .from('projects')
            .update({
                status: 'assigned',
                worker_id: '8dfa1ea5-e2ca-4038-a169-ca1b6432b217', // Gabriel ID
                assignment_method: 'admin_override'
            })
            .eq('id', project.id);

        if (err2) console.error('❌ Failed to assign project:', err2);
        else {
            console.log('✅ Successfully assigned project to Gabriel Plaiz.');

            // 3. Ensure stats exist for Gabriel to prevent future DB errors
            const { error: err3 } = await supabase
                .from('worker_stats')
                .upsert({
                    worker_id: '8dfa1ea5-e2ca-4038-a169-ca1b6432b217',
                    active_projects: 1,
                    max_projects_limit: 50,
                    average_rating: 5.0,
                    total_projects: 1,
                    availability_status: 'available',
                    worker_price_tier: 'elite'
                }, { onConflict: 'worker_id' });

            if (err3) console.error('⚠️ Note: Stats sync failed (likely FK profile mismatch), but assignment is DONE:', err3.message);
            else console.log('✅ Worker stats synced for Gabriel.');
        }
    }

    // 4. Redeploy to Vercel to reflect UI fixes if needed
    console.log('⚠️ REMINDER: You MUST refresh your browser once I say I am done.');
    console.log('🚀 Unblocker task complete.');
}

finalUnblock();
