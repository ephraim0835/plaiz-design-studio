
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWorkers() {
    console.log('Checking Workers...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, skill, is_active, is_available, minimum_price')
        .neq('role', 'client');

    if (error) {
        console.error('Error fetching workers:', error);
        return;
    }

    console.log('Workers found:', profiles.length);
    profiles.forEach(p => {
        console.log(`- ${p.full_name} (${p.role}): active=${p.is_active}, available=${p.is_available}, skill=${p.skill}, min_price=${p.minimum_price}`);
    });

    const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('id, title, status, worker_id, project_type')
        .eq('status', 'queued')
        .limit(5);

    if (projError) {
        console.error('Error fetching projects:', projError);
    } else {
        console.log('Queued Projects:', projects.length);
        projects.forEach(p => {
            console.log(`- ${p.title} (ID: ${p.id}): type=${p.project_type}, worker_id=${p.worker_id}`);
        });
    }
}

checkWorkers();
