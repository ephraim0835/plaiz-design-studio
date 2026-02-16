
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFix() {
    console.log('--- Starting Database Repair ---');

    // 1. Increase Pixelz capacity
    const { error: err1 } = await supabase
        .from('worker_stats')
        .update({ max_projects_limit: 20 })
        .eq('worker_id', '1da97a0f-386e-4baa-a7e5-06a10709c4c9');

    if (err1) console.error('Error updating worker_stats:', err1);
    else console.log('Successfully increased Pixelz capacity to 20.');

    // 2. Assign project to Gabriel Plaiz
    // Project ID: c80db9d5-1b01-4d2e-8374-9cd7c6423576
    // Gabriel ID: 8dfa1ea5-e2ca-4038-a169-ca1b6432b217
    const { error: err2 } = await supabase
        .from('projects')
        .update({
            status: 'assigned',
            worker_id: '8dfa1ea5-e2ca-4038-a169-ca1b6432b217'
        })
        .eq('id', 'c80db9d5-1b01-4d2e-8374-9cd7c6423576');

    if (err2) console.error('Error updating project:', err2);
    else console.log('Successfully assigned project to Gabriel Plaiz.');

    // 3. Sync stats for Gabriel
    const { error: err3 } = await supabase
        .from('worker_stats')
        .upsert({
            worker_id: '8dfa1ea5-e2ca-4038-a169-ca1b6432b217',
            active_projects: 1,
            max_projects_limit: 20,
            average_rating: 5.0,
            total_projects: 1,
            availability_status: 'available'
        });

    if (err3) console.error('Error upserting Gabriel stats:', err3);
    else console.log('Successfully synced worker stats for Gabriel.');

    console.log('--- Database Repair Complete ---');
}

runFix();
