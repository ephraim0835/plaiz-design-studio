
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpdate() {
    const id = '54a7f33d-8aeb-4aca-b98a-53097cb00234';
    console.log(`📡 Testing UPDATE for ID: ${id}`);

    const { data, error } = await supabase
        .from('projects')
        .update({ title: 'TEST_UPDATE' })
        .eq('id', id)
        .select();

    if (error) console.error('❌ UPDATE FAILED:', error);
    else console.log('✅ UPDATE SUCCESS:', data);
}

testUpdate();
