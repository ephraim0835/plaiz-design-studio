
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceComplete() {
    console.log('🔍 Final attempt to complete "novelty"...');

    // 1. Get Project
    const { data: project } = await supabase.from('projects').select('*').ilike('title', '%novelty%').single();
    if (!project) return console.log('❌ Not found.');
    const projectId = project.id;
    const clientId = project.client_id;

    // 2. Ensure we have A payment record for balance_60
    console.log('💰 Ensuring payment record exists...');
    const { data: payment } = await supabase.from('payments')
        .insert({
            project_id: projectId,
            client_id: clientId,
            amount: 300,
            reference: 'FORCE_COMPLETE_' + Date.now(),
            status: 'completed',
            type: 'project_milestone'
        })
        .select('id')
        .single();

    if (!payment) {
        console.error('❌ Could not create payment record.');
        return;
    }

    const paymentId = payment.id;
    console.log(`✅ Payment ID: ${paymentId}`);

    // 3. Force Status
    console.log('🚀 Forcing project to COMPLETED...');
    const { data, error } = await supabase
        .from('projects')
        .update({
            status: 'completed',
            total_paid: (project.total_paid || 0) + 300,
            final_payment_id: paymentId,
            payout_split_done: true
        })
        .eq('id', projectId)
        .select();

    if (error) {
        console.error('❌ Project Update Error:', error);
    } else {
        console.log('✅ Update successful:', data[0].status);
    }
}

forceComplete();
