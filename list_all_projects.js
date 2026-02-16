
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAll() {
    const { data, error } = await supabase.from('projects').select('id, title, status');
    if (error) console.error(error);
    else {
        console.log(`📋 Found ${data.length} projects:`);
        data.forEach(p => {
            console.log(`- [${p.id}] "${p.title}" (${p.status})`);
        });
    }
}

listAll();
