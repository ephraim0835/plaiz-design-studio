
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findBlockingMessages() {
    const id = '54a7f33d-8aeb-4aca-b98a-53097cb00234';
    console.log(`🔍 Searching ALL messages for project reference: ${id}`);

    const { data: messages, error } = await supabase.from('messages').select('*');
    if (error) {
        console.error(error);
        return;
    }

    const matches = messages.filter(m => m.project_id === id);
    console.log(`📋 Found ${matches.length} matching messages out of ${messages.length} total.`);

    if (matches.length > 0) {
        const mIds = matches.map(m => m.id);
        console.log(`🧨 Deleting messages: ${mIds.join(', ')}`);
        const { error: delErr } = await supabase.from('messages').delete().in('id', mIds);
        if (delErr) console.error('❌ Delete failed:', delErr);
        else console.log('✅ Messages deleted.');
    }
}

findBlockingMessages();
