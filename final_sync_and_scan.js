
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalSync() {
    console.log('🔍 Locating "novelty" project...');
    const { data: projects, error: pErr } = await supabase
        .from('projects')
        .select('*')
        .ilike('title', '%novelty%');

    if (!projects || projects.length === 0) {
        console.log('❌ Project not found.');
    } else {
        const project = projects[0];
        const projectId = project.id;
        const clientId = project.client_id;
        console.log(`✅ Found Project ID: ${projectId}`);

        // 1. Create Payment
        console.log('💰 Inserting final payment record...');
        let paymentId = null;

        // Try with phase first
        const { data: p1, error: e1 } = await supabase
            .from('payments')
            .insert({
                project_id: projectId,
                client_id: clientId,
                amount: 300,
                reference: 'FINAL_SYNC_' + Date.now(),
                status: 'completed',
                type: 'project_milestone',
                phase: 'balance_60'
            })
            .select('id')
            .single();

        if (!e1) {
            paymentId = p1.id;
        } else {
            console.warn('⚠️ Phase-based insert failed, retrying without phase...');
            const { data: p2, error: e2 } = await supabase
                .from('payments')
                .insert({
                    project_id: projectId,
                    client_id: clientId,
                    amount: 300,
                    reference: 'FINAL_SYNC_RETRY_' + Date.now(),
                    status: 'completed',
                    type: 'project_milestone'
                })
                .select('id')
                .single();

            if (!e2) {
                paymentId = p2.id;
            } else {
                console.error('❌ Payment log failed twice:', e2.message);
                // If payment fails, we might need to use a dummy ID if final_payment_id is strictly required NOT NULL
                // but let's hope one of these works.
            }
        }

        // 2. Update Project
        if (paymentId) {
            console.log(`✨ Updating project status with Payment ID: ${paymentId}`);
            const { error: updErr } = await supabase
                .from('projects')
                .update({
                    status: 'completed',
                    total_paid: (project.total_paid || 0) + 300,
                    final_payment_id: paymentId,
                    payout_split_done: true
                })
                .eq('id', projectId);

            if (updErr) console.error('❌ Final update failed:', updErr.message);
            else console.log('✅ "novelty" project is COMPLETED.');
        } else {
            // If we CANNOT create a payment row, we might have to settle for just the status if NOT NULL isn't on the DB level but just RPC?
            // No, the error clearly said DB relation constraint.
            console.log('❌ Cannot proceed without a valid payment ID.');
        }
    }

    // 3. Scan for other queued projects
    console.log('🕵️ Scanning for other "queued" projects...');
    const { data: queued, error: qErr } = await supabase
        .from('projects')
        .select('id, title, status')
        .eq('status', 'queued');

    if (queued && queued.length > 0) {
        console.log(`⚠️ Found ${queued.length} other queued projects:`);
        queued.forEach(q => console.log(`   - [${q.id}] ${q.title}`));
        // We might want to trigger matching for these?
    } else {
        console.log('✅ No other projects are currently queued.');
    }
}

finalSync();
