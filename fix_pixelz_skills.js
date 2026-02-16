
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixPixelzSkills() {
    const pixelzId = '1da97a0f-386e-4baa-a7e5-06a10709c4c9';
    console.log(`🔧 Fixing skills for Pixelz (${pixelzId})...`);

    // 1. Update Profile Skill
    const { error: profErr } = await supabase
        .from('profiles')
        .update({ skill: 'graphics' })
        .eq('id', pixelzId);

    if (profErr) console.error('❌ Profile update failed:', profErr.message);
    else console.log('✅ Profile skill updated to "graphics".');

    // 2. Add to worker_rotation for major skills
    const skills = ['graphics', 'web', 'printing'];
    for (const skill of skills) {
        const { error: rotErr } = await supabase
            .from('worker_rotation')
            .upsert({
                worker_id: pixelzId,
                skill: skill,
                last_assigned_at: new Date('1970-01-01').toISOString(),
                assignment_count: 0
            }, { onConflict: 'worker_id,skill' });

        if (rotErr) console.error(`❌ Rotation add failed for ${skill}:`, rotErr.message);
        else console.log(`✅ Rotation onboarding success for: ${skill}`);
    }

    // 3. Trigger match
    console.log('⚡ Triggering match again...');
    const { data: workerId, error: matchErr } = await supabase.rpc('match_worker_to_project', {
        p_skill: 'graphics',
        p_budget: 0,
        p_project_id: '4a310b96-4298-4437-bcc2-6979267104be' // "novelty" project
    });

    if (matchErr) console.error('❌ Match failed:', matchErr.message);
    else console.log('✅ SUCCESS! Project matched to:', workerId);
}

fixPixelzSkills();
