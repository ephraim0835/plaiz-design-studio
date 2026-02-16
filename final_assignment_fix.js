
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalAssignment() {
    const projectId = 'd8aca9a2-4d92-11ef-af19-c764eb9209a6'; // "jk"
    const pixelzId = '87910103-6058-48be-8167-739c94157989';

    console.log(`🚀 Forcing assignment of "${projectId}" to Pixelz...`);

    // We try to update with only the required fields
    const { data, error } = await supabase
        .from('projects')
        .update({
            worker_id: pixelzId,
            status: 'assigned',
            assigned_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select();

    if (error) {
        console.error('❌ Update Error:', error.message);
        // If it still fails with schema cache, we'll try to use the raw fetch
        console.log('🔄 Attempting raw fetch bypass...');
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}`, {
            method: 'PATCH',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                worker_id: pixelzId,
                status: 'assigned',
                assigned_at: new Date().toISOString()
            })
        });
        const resData = await response.json();
        if (response.ok) {
            console.log('✅ Raw update success!');
        } else {
            console.error('❌ Raw update failed:', resData);
        }
    } else {
        console.log('✅ Update success!', data[0].status);
    }
}

finalAssignment();
