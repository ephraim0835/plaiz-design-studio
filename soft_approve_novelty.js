
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function softApprove() {
    console.log('🔍 Soft approving "novelty"...');

    // 1. Get Project
    const { data: project } = await supabase.from('projects').select('*').ilike('title', '%novelty%').single();
    if (!project) return console.log('❌ Not found.');
    const projectId = project.id;

    // 2. Set to awaiting_final_payment (the step before completed)
    // This state usually shows "Client Approved Samples" or similar.
    console.log('🚀 Setting status to awaiting_final_payment...');
    const { error } = await supabase.from('projects').update({
        status: 'awaiting_final_payment',
        total_paid: 600,
        completed_at: new Date().toISOString()
    }).eq('id', projectId);

    if (error) {
        console.error('❌ Soft update failed:', error.message);
    } else {
        console.log('✅ Project "novelty" is now in awaiting_final_payment.');

        // Add system message
        await supabase.from('messages').insert({
            project_id: projectId,
            sender_id: project.client_id,
            content: 'Payment verified! Your project is being finalized. You will be able to download your files shortly.',
            is_system_message: true
        });
    }
}

softApprove();
