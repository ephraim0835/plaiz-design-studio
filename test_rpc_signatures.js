
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAllSignatures() {
    const projectId = '4a310b96-4298-4437-bcc2-6979267104be';
    console.log('🧪 Testing RPC Signatures...');

    const payloads = [
        { name: 'Named (v17 style)', args: { p_skill: 'graphics', p_budget: 0, p_project_id: projectId } },
        { name: 'Named (v3 style)', args: { p_project_id: projectId, p_skill: 'graphics', p_budget: 0 } },
        { name: 'Positional-ish (Just project_id)', args: { p_project_id: projectId } }
    ];

    for (const p of payloads) {
        console.log(`📡 Trying: ${p.name}...`);
        const { data, error } = await supabase.rpc('match_worker_to_project', p.args);
        if (error) {
            console.log(`❌ ${p.name} failed: ${error.message}`);
        } else {
            console.log(`✅ ${p.name} success: ${data}`);
            break;
        }
    }

    // Verify
    const { data: verify } = await supabase.from('projects').select('status, worker_id').eq('id', projectId).single();
    console.log('📋 Result State:', JSON.stringify(verify, null, 2));
}

testAllSignatures();
