
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTriggersAndSchema() {
    console.log('🔍 Deep inspecting table: projects');

    // We can't run raw SQL via .from(), so we hope there's an exec_sql or similar.
    // If not, we try to fetch one row and see all columns.
    const { data: cols, error: cErr } = await supabase.from('projects').select('*').limit(1);

    if (cErr) {
        console.error('❌ Error fetching project:', cErr.message);
    } else {
        console.log('📋 Existing columns in project:', Object.keys(cols[0]));
    }

    // Try to find any "RPC" that allows SQL if possible.
    // Since we don't know, let's try to update one minor field to see if triggers fire.
    console.log('🧪 Testing status-only update...');
    const { error: tErr } = await supabase.from('projects').update({ status: 'in_progress' }).eq('title', 'novelty');
    if (tErr) console.log('❌ Status-only update failed:', tErr.message);
    else console.log('✅ Status-only update succeeded.');

    // Final check for payment ID
    console.log('🧪 Testing with a random UUID for final_payment_id...');
    const dummyId = '11111111-1111-1111-1111-111111111111';
    const { error: fErr } = await supabase.from('projects').update({
        status: 'completed',
        final_payment_id: dummyId
    }).eq('title', 'novelty');

    if (fErr) console.log('❌ Final update with dummy ID failed:', fErr.message);
    else console.log('✅ Final update with dummy ID succeeded.');
}

inspectTriggersAndSchema();
