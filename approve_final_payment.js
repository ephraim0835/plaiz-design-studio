
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function approveFinalPayment() {
    const projectId = '4a310b96-4298-4437-96a0-833486dc3262'; // novelty
    console.log(`🚀 Manually approving final payment for project: ${projectId}`);

    // 1. Get project details
    const { data: project, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (pErr) {
        console.error('❌ Project not found:', pErr.message);
        return;
    }

    const clientId = project.client_id;
    const currentPaid = project.total_paid || 0;
    const finalAmount = 300; // From user screenshot (60% balance)

    // 2. Insert payment record
    console.log(`💰 Logging final payment of ₦${finalAmount}...`);
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
        console.error('❌ Failed to log payment:', payErr.message);
        // If 'phase' column doesn't exist yet, we'll try without it
        if (payErr.message.includes('column "phase"')) {
            console.log('⚠️ "phase" column missing, retrying without it...');
            const { error: retryErr } = await supabase
                .from('payments')
                .insert({
                    project_id: projectId,
                    client_id: clientId,
                    amount: finalAmount,
                    reference: 'MANUAL_APPROVAL_FINAL_' + Date.now(),
                    status: 'completed',
                    type: 'project_milestone'
                });
            if (retryErr) console.error('❌ Retry failed:', retryErr.message);
        }
    } else {
        console.log('✅ Payment record created.');
    }

    // 3. Update project status to completed
    console.log('✨ Marking project as completed...');
    const { error: updErr } = await supabase
        .from('projects')
        .update({
            status: 'completed',
            total_paid: currentPaid + finalAmount,
            final_payment_id: payment?.id || null,
            payout_split_done: true
        })
        .eq('id', projectId);

    if (updErr) {
        console.error('❌ Project update failed:', updErr.message);
    } else {
        console.log('✅ Project marked as completed!');
    }

    // 4. Send system message to chat
    console.log('✉️ Sending confirmation message to chat...');
    await supabase.from('messages').insert({
        project_id: projectId,
        sender_id: clientId, // Representing client action
        content: 'Final payment (60%) received. Project completed! Your high-quality files are now unlocked.',
        is_system_message: true
    });
}

approveFinalPayment();
