
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyPixelz() {
    const pixelzId = '1da97a0f-386e-4baa-a7e5-06a10709c4c9';
    console.log(`🏦 Verifying bank account for Pixelz (${pixelzId})...`);

    const { data, error } = await supabase
        .from('bank_accounts')
        .update({ is_verified: true })
        .eq('worker_id', pixelzId)
        .select();

    if (error) {
        console.error('❌ Failed to verify bank account:', error.message);
    } else {
        console.log('✅ Bank account verified successfully.');
    }

    // Also manually trigger match for the project
    console.log('⚡ Triggering manual match for queued projects...');
    const { data: projects } = await supabase.from('projects').select('id, project_type, estimated_budget').eq('status', 'queued');

    if (projects && projects.length > 0) {
        for (const p of projects) {
            console.log(`⚡ Matching project: ${p.id}`);
            const { data: worker, error: matchErr } = await supabase.rpc('match_worker_to_project', {
                p_project_id: p.id,
                p_skill: p.project_type,
                p_budget: p.estimated_budget || 0
            });
            if (matchErr) console.error(`❌ Match failed for ${p.id}:`, matchErr.message);
            else console.log(`✅ Project ${p.id} matched to: ${worker}`);
        }
    }
}

verifyPixelz();
