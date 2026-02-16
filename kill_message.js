
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function killMessage() {
    const id = '54a7f33d-8aeb-4aca-b98a-53097cb00234';
    // Join messages and find the one that doesn't have our ID but is joined
    const { data: project, error } = await supabase.from('projects').select('*, messages(*)').eq('id', id).single();

    if (error) {
        console.error(error);
        return;
    }

    if (project.messages && project.messages.length > 0) {
        console.log(`📋 Found ${project.messages.length} messages for project.`);
        for (const m of project.messages) {
            console.log('📋 Message found:', m);
            // Delete by ID
            const { error: delErr } = await supabase.from('messages').delete().eq('id', m.id);
            if (delErr) console.error(`❌ Failed to delete message ${m.id}:`, delErr.message);
            else console.log(`✅ Message ${m.id} deleted.`);
        }
    } else {
        console.log('✨ No messages found in join.');
    }
}

killMessage();
