
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAwaitingPayment() {
    console.log('🧹 Starting Cleanup of Projects Awaiting Down Payment...');

    const statuses = ['pending_down_payment'];

    // 1. Get all relevant project IDs
    const { data: projects, error: fetchError } = await supabase
        .from('projects')
        .select('id, title, status')
        .in('status', statuses);

    if (fetchError) {
        console.error('❌ Error fetching projects:', fetchError);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('✨ No projects found awaiting down payment.');
        return;
    }

    const ids = projects.map(p => p.id);
    console.log(`🔍 Found ${ids.length} projects to delete.`);
    console.log('📋 Titles:', projects.map(p => `${p.title} (${p.status})`).join(', '));

    // 2. Delete dependencies in order
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
            console.log(`⚠️ Note: Deletion from ${table} skip/fail:`, delErr.message);
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
        console.log(`✅ Successfully deleted ${ids.length} projects.`);
    }

    console.log('🧹 Cleanup complete.');
}

cleanupAwaitingPayment();
