
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteSpecificProject() {
    console.log('🧹 Starting Deletion of Project "novelty"...');

    const projectId = '54a7f33d-8aeb-4aca-b98a-53097cb00234';

    // 1. Delete dependencies in order
    const dependencyTables = [
        'messages',
        'project_files',
        'agreements',
        'project_reviews',
        'payout_logs',
        'payments'
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
        console.log(`✅ Successfully deleted project "novelty".`);
    }

    console.log('🧹 Cleanup complete.');
}

deleteSpecificProject();
