
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteCompleted() {
    console.log('🧹 Starting Cleanup of Completed Projects (Phase 2)...');

    // 1. Get all completed project IDs
    const { data: completedProjects, error: fetchError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('status', 'completed');

    if (fetchError) {
        console.error('❌ Error fetching completed projects:', fetchError);
        return;
    }

    if (!completedProjects || completedProjects.length === 0) {
        console.log('✨ No completed projects found to delete.');
        return;
    }

    const ids = completedProjects.map(p => p.id);
    console.log(`🔍 Found ${ids.length} completed projects to delete.`);

    // 2. Delete dependencies in order
    // Based on FK error, we need payments/payout_logs too
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
            .in('project_id', ids);

        if (delErr) {
            console.log(`⚠️ Note: Deletion from ${table} may have failed or table schema differs:`, delErr.message);
        } else {
            console.log(`✅ Cleaned up ${table}.`);
        }
    }

    // 3. Delete the projects themselves
    const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .in('id', ids);

    if (projectError) {
        console.error('❌ Failed to delete projects:', projectError);
    } else {
        console.log(`✅ Successfully deleted ${ids.length} completed projects.`);
    }

    console.log('🧹 Cleanup complete.');
}

deleteCompleted();
