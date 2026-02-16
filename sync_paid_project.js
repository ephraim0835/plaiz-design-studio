
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncPaidProject() {
    const projectId = '4a310b96-4298-4437-96a0-833486dc3262'; // novelty
    console.log(`🔍 Syncing paid project: ${projectId}`);

    // 1. Double check the project
    const { data: project, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (pErr) {
        console.error('❌ Project not found:', pErr.message);
        return;
    }

    console.log(`📋 Current Status: ${project.status}`);

    // 2. Check for payments
    const { data: payments, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId);

    if (payErr) {
        console.error('❌ Error fetching payments:', payErr.message);
    } else {
        console.log(`💰 Found ${payments.length} payments.`);
        payments.forEach(p => console.log(`   - Reference: ${p.reference}, Amount: ₦${p.amount}, Phase: ${p.phase}, Status: ${p.status}`));
    }

    // 3. Force status to work_started if payment exists
    if (payments && payments.length > 0 && project.status === 'queued') {
        console.log('🚀 Forcing status to "work_started"...');
        const { error: updErr } = await supabase
            .from('projects')
            .update({
                status: 'work_started',
                total_paid: payments.reduce((acc, p) => acc + p.amount, 0)
            })
            .eq('id', projectId);

        if (updErr) console.error('❌ Update failed:', updErr.message);
        else console.log('✅ Status updated successfully.');
    } else if (project.status === 'work_started' || project.status === 'in_progress' || project.status === 'assigned') {
        console.log('✨ Project is already past queue status.');
    } else {
        // Just force it anyway if the user says they paid and we see it
        console.log('🚀 Forcing status to "work_started" manually as per user request...');
        const { error: updErr } = await supabase
            .from('projects')
            .update({
                status: 'work_started'
            })
            .eq('id', projectId);

        if (updErr) console.error('❌ Update failed:', updErr.message);
        else console.log('✅ Status updated successfully.');
    }
}

syncPaidProject();
