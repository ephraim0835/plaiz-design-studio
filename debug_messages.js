
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugMessages() {
    const id = '54a7f33d-8aeb-4aca-b98a-53097cb00234';
    const { data: project, error } = await supabase.from('projects').select('*, messages(*)').eq('id', id).single();

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('📋 Project found:', project.title);
        console.log('📋 Messages found:', project.messages.length);
        if (project.messages.length > 0) {
            console.log('📋 First message structure:', Object.keys(project.messages[0]));
            project.messages.forEach(m => {
                console.log(`- Message ID: ${m.id}`);
            });
        }
    }
}

debugMessages();
