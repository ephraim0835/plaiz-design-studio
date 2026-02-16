
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteSpecificProject() {
    console.log('🧹 Starting Deletion of Project "novelty"...');

    // Find project ID by BOTH title and description to be safe
    const { data: project, error: findError } = await supabase
        .from('projects')
        .select('id, title, status')
        .or('title.eq.novelty,description.eq.ghj')
        .single();

    if (findError || !project) {
        console.log('✨ Project "novelty" not found in database.');
        return;
    }

    const projectId = project.id;
    console.log(`🔍 Found project: ${project.title} (${projectId}) with status ${project.status}`);

    // 1. Delete dependencies in order
    const dependencyTables = [
        'messages',
        'project_files',
        'agreements',
        'project_reviews',
        'payout_logs',
        'payments',
        'notifications' // Adding notifications just in case
    ];

    for (const table of dependencyTables) {
        const { error: delErr } = await supabase
            .from(table)
            .delete()
            .eq('project_id', projectId);

        if (delErr) {
            console.log(`⚠️ Note: Deletion from ${table} skip/fail:`, delErr.message);
        } else {
            console.log(`✅ Cleaned up ${table}.`);
        }
    }

    // 2. Delete the project itself
    const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (projectError) {
        console.error('❌ Failed to delete project:', projectError);
    } else {
        console.log(`✅ Successfully deleted project "novelty" (${projectId}).`);

        // 3. VERIFY DELETION
        const { data: verify, error: verifyError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .maybeSingle();

        if (verify) {
            console.error('❌ VERIFICATION FAILED: Project still exists after delete call!');
        } else {
            console.log('✅ VERIFICATION SUCCESS: Project is gone from database.');
        }
    }

    console.log('🧹 Cleanup complete.');
}

deleteSpecificProject();
