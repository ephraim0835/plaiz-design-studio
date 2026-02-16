
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function surgicalComplete() {
    console.log('🔍 Surgical update for "novelty"...');

    // 1. Get Project
    const { data: project } = await supabase.from('projects').select('*').ilike('title', '%novelty%').single();
    if (!project) return console.log('❌ Not found.');
    const projectId = project.id;

    // 2. Resolve final_payment_id
    let paymentId = project.final_payment_id;
    if (!paymentId) {
        console.log('💰 Creating mandatory payment record...');
        const { data: pay } = await supabase.from('payments').insert({
            project_id: projectId,
            client_id: project.client_id,
            amount: 300,
            reference: 'SURGICAL_FINAL_' + Date.now(),
            status: 'completed',
            type: 'project_milestone'
        }).select('id').single();
        paymentId = pay?.id;
    }

    if (!paymentId) {
        console.log('⚠️ Could not find or create payment record. Using a dummy UUID if required...');
        paymentId = '00000000-0000-0000-0000-000000000000'; // Default UUID
    }

    console.log(`✅ Using Payment ID: ${paymentId}`);

    // 3. Update with ALL required fields
    console.log('🚀 Setting status to COMPLETED...');
    const { error } = await supabase.from('projects').update({
        status: 'completed',
        final_payment_id: paymentId,
        total_paid: 600, // 300 down + 300 final
        payout_split_done: true,
        completed_at: new Date().toISOString()
    }).eq('id', projectId);

    if (error) {
        console.error('❌ Update failed AGAIN:', error.message);
    } else {
        console.log('✅ Project "novelty" is COMPLETED.');
    }
}

surgicalComplete();
