
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getStats() {
    const { data, error } = await supabase
        .from('worker_stats')
        .select('*')
        .eq('worker_id', '1da97a0f-386e-4baa-a7e5-06a10709c4c9')
        .single();

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

getStats();
