
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testConnectivity() {
    const projectId = 'd8aca9a2-4d92-11ef-af19-c764eb9209a6'; // "jk"
    console.log(`🔍 Testing connectivity for project: ${projectId}`);

    // 1. Try to update title (safe old column)
    const { data: d1, error: e1 } = await supabase
        .from('projects')
        .update({ title: 'jk - Assigned' })
        .eq('id', projectId)
        .select();

    if (e1) console.error('❌ Title update failed:', e1.message);
    else console.log('✅ Title update worked!');

    // 2. Try to update status (safe old column)
    const { data: d2, error: e2 } = await supabase
        .from('projects')
        .update({ status: 'assigned' })
        .eq('id', projectId)
        .select();

    if (e2) console.error('❌ Status update failed:', e2.message);
    else console.log('✅ Status update worked!');

    // 3. Try worker_id again
    const pixelzId = '87910103-6058-48be-8167-739c94157989';
    const { error: e3 } = await supabase
        .from('projects')
        .update({ worker_id: pixelzId })
        .eq('id', projectId);

    if (e3) console.error('❌ Worker assignment failed:', e3.message);
    else console.log('✅ Worker assignment worked!');
}

testConnectivity();
