
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncByTitle() {
    console.log('🔍 Searching for project "novelty"...');
    const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .ilike('title', '%novelty%');

    if (pErr) {
        console.error('❌ Error:', pErr.message);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('❌ No project "novelty" found.');
        return;
    }

    const project = projects[0];
    console.log(`✅ Found: ${project.id} | Title: ${project.title} | Status: ${project.status}`);

    const projectId = project.id;

    // Check for payments
    const { data: payments, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId);

    if (payments && payments.length > 0) {
        console.log(`💰 Payments found: ${payments.length}`);
        console.log('🚀 Forcing status to "work_started"...');
        await supabase.from('projects').update({ status: 'work_started' }).eq('id', projectId);
        console.log('✅ Done.');
    } else {
        console.log('⚠️ No payment records found, but user says they paid. Forcing to "work_started" anyway.');
        await supabase.from('projects').update({ status: 'work_started' }).eq('id', projectId);
        console.log('✅ Forced.');
    }
}

syncByTitle();
