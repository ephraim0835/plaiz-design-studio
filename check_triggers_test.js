
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTriggersAndForce() {
    console.log('🔍 Querying Triggers on projects table...');
    const { data: triggers, error: tErr } = await supabase.rpc('get_table_triggers', { t_name: 'projects' });

    // If RPC doesn't exist, use raw SQL via a different way
    if (tErr) {
        console.log('⚠️ Could not find get_table_triggers RPC. Trying direct query...');
        // We can't run raw SQL via supabase-js easily without an RPC.
    } else {
        console.log('📋 Triggers:', JSON.stringify(triggers, null, 2));
    }

    const id = '4a310b96-4298-4437-96a0-833486dc3262';
    console.log(`🚀 Attempting status-only update for project ${id}...`);
    const { error: updErr } = await supabase
        .from('projects')
        .update({ status: 'assigned' })
        .eq('id', id)
        .select();

    if (updErr) console.error('❌ Status update failed:', updErr.message);
    else console.log('✅ Status update call finished. Checking if it stuck...');

    const { data: verify } = await supabase.from('projects').select('status').eq('id', id).single();
    if (verify.status === 'assigned') {
        console.log('✨ Status STUCK as assigned!');
    } else {
        console.log(`💀 Status REVERTED to ${verify.status}. A trigger is active.`);
    }
}

checkTriggersAndForce();
