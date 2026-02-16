
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listQueuedAndPixelz() {
    console.log('🔍 Searching for "queued" projects and Pixelz...');

    // 1. Get Pixelz
    const { data: pixelz, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .ilike('full_name', '%Pixelz%')
        .single();

    if (pErr) console.error('❌ Error finding Pixelz:', pErr.message);
    else console.log(`✅ Found Pixelz: ${pixelz.id} (${pixelz.full_name})`);

    // 2. Get Queued Projects
    const { data: queued, error: qErr } = await supabase
        .from('projects')
        .select('id, title, status')
        .eq('status', 'queued');

    if (qErr) console.error('❌ Error finding queued projects:', qErr.message);
    else {
        console.log(`📋 Found ${queued.length} queued projects:`);
        queued.forEach(q => console.log(`   - [${q.id}] ${q.title}`));
    }
}

listQueuedAndPixelz();
