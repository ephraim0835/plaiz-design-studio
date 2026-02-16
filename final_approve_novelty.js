
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalApprove() {
    console.log('🔍 Finding project "novelty"...');
    const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .ilike('title', '%novelty%');

    if (pErr) {
        console.error('❌ Fetch Error:', pErr.message);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('❌ No project "novelty" found.');
        return;
    }

    const project = projects[0];
    const projectId = project.id;
    const clientId = project.client_id;
    console.log(`✅ Found: ${projectId} | Status: ${project.status}`);

    const finalAmount = 300;

    // 1. Log Payment
    console.log('💰 Logging final payment...');
    const { data: payment, error: payErr } = await supabase
        .from('payments')
        .insert({
            project_id: projectId,
            client_id: clientId,
            amount: finalAmount,
            reference: 'MANUAL_APPROVAL_FINAL_' + Date.now(),
            status: 'completed',
            type: 'project_milestone',
            phase: 'balance_60'
        })
        .select()
        .single();

    if (payErr) {
        console.warn('⚠️ Payment Insert Warning (might be column mismatch):', payErr.message);
        // Retry without phase if needed
        if (payErr.message.includes('column "phase"')) {
            await supabase.from('payments').insert({
                project_id: projectId,
                client_id: clientId,
                amount: finalAmount,
                reference: 'MANUAL_APPROVAL_FINAL_RETRY_' + Date.now(),
                status: 'completed',
                type: 'project_milestone'
            });
        }
    }

    // 2. Update status
    console.log('✨ Marking project COMPLETED...');
    const { error: updErr } = await supabase
        .from('projects')
        .update({
            status: 'completed',
            total_paid: (project.total_paid || 0) + finalAmount,
            payout_split_done: true
        })
        .eq('id', projectId);

    if (updErr) console.error('❌ Update Error:', updErr.message);
    else console.log('✅ Project COMPLETED.');

    // 3. System Message
    await supabase.from('messages').insert({
        project_id: projectId,
        sender_id: clientId,
        content: 'Final payment received. Project completed! Files unlocked.',
        is_system_message: true
    });
}

finalApprove();
