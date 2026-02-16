
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function absoluteDelete() {
    const id = '54a7f33d-8aeb-4aca-b98a-53097cb00234';
    console.log(`🧨 Targeted Delete for ID: ${id}`);

    // Try to delete children first
    const children = ['messages', 'project_files', 'agreements', 'project_reviews', 'payout_logs', 'payments', 'notifications'];
    for (const table of children) {
        const { error } = await supabase.from(table).delete().eq('project_id', id);
        if (error) console.log(`⚠️ ${table}: ${error.message}`);
        else console.log(`✅ ${table}`);
    }

    // Now delete project
    const { data, error, status } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .select();

    console.log(`📡 Status: ${status}`);
    if (error) {
        console.error('❌ ERROR:', error);
    } else {
        console.log('✅ RESPONSE DATA:', data);
    }

    // Verify
    const { data: check } = await supabase.from('projects').select('id').eq('id', id).maybeSingle();
    if (check) console.error('💀 STILL EXISTS IN DB');
    else console.log('🎉 SUCCESSFULLY REMOVED');
}

absoluteDelete();
