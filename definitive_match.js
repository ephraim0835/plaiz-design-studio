
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function definitiveMatch() {
    const id = '4a310b96-4298-4437-96a0-833486dc3262';
    console.log(`⚡ Definitive Match for ID: ${id}`);

    const { data: workerId, error } = await supabase.rpc('match_worker_to_project', {
        p_skill: 'graphics',
        p_budget: 0,
        p_project_id: id
    });

    if (error) {
        console.error('❌ RPC Failed:', error.message);
    } else {
        console.log('✅ RPC Success! Worker:', workerId);
    }

    const { data: verify } = await supabase.from('projects').select('status, worker_id').eq('id', id).single();
    console.log('📋 Final State:', JSON.stringify(verify, null, 2));
}

definitiveMatch();
