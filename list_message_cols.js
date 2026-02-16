
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listCols() {
    const { data, error } = await supabase.from('messages').select('*').limit(1);
    if (error) {
        console.error('❌ Error:', error);
    } else if (data && data.length > 0) {
        console.log('📋 Message columns:', Object.keys(data[0]));
    } else {
        console.log('📋 No messages found to inspect columns.');
    }
}

listCols();
