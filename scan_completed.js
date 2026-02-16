
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function scanCompleted() {
    console.log('🔍 Scanning projects for pattern matching...');
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error('❌ Error:', error.message);

    console.log(`📋 Total projects found: ${projects.length}`);
    projects.forEach(p => {
        console.log(`- [${p.id}] ${p.title} | Status: ${p.status} | FinalPayID: ${p.final_payment_id}`);
    });

    const completed = projects.filter(p => p.status === 'completed');
    if (completed.length > 0) {
        console.log('✅ Found a completed project example!');
        console.log(JSON.stringify(completed[0], null, 2));
    } else {
        console.log('⚠️ No projects are currently COMPLETED in the database.');
    }
}

scanCompleted();
