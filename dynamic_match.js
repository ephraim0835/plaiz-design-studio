
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findAndMatch() {
    console.log('🔍 Locating "novelty" project...');
    const { data: projects, error: pErr } = await supabase.from('projects').select('id, title, status, project_type').eq('title', 'novelty');

    if (pErr || !projects || projects.length === 0) {
        console.error('❌ Could not find "novelty" project.');
        return;
    }

    const project = projects[0];
    console.log(`✅ Found project: ${project.title} (ID: ${project.id}) - Status: ${project.status}`);

    // Try signature 1: (id, skill, budget)
    console.log('⚡ Attempting Match (Signature: ID, Skill, Budget)...');
    const { data: res1, error: err1 } = await supabase.rpc('match_worker_to_project', {
        p_project_id: project.id,
        p_skill: 'graphics',
        p_budget: 0
    });

    if (err1) {
        console.log('⚠️ Signature 1 failed:', err1.message);
        // Try signature 2: (skill, budget, id)
        console.log('⚡ Attempting Match (Signature: Skill, Budget, ID)...');
        const { data: res2, error: err2 } = await supabase.rpc('match_worker_to_project', {
            p_skill: 'graphics',
            p_budget: 0,
            p_project_id: project.id
        });

        if (err2) {
            console.error('❌ Signature 2 failed too:', err2.message);
        } else {
            console.log('✅ Signature 2 Success! matched:', res2);
        }
    } else {
        console.log('✅ Signature 1 Success! matched:', res1);
    }

    // Verify
    const { data: verify } = await supabase.from('projects').select('status, worker_id').eq('id', project.id).single();
    console.log('📋 Final State:', JSON.stringify(verify, null, 2));
}

findAndMatch();
