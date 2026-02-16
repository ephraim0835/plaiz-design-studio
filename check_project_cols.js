
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProjectColumns() {
    console.log('🔍 Fetching one project and its keys...');
    const { data, error } = await supabase.from('projects').select('*').limit(1).single();
    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('📋 Columns in projects table:');
        console.log(Object.keys(data).sort().join(', '));
    }
}

checkProjectColumns();
