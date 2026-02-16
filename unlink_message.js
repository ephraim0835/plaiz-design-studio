
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function unlinkMessage() {
    const messageId = '31fc2669-a724-4f92-9f37-160100d072b0';
    console.log(`🔗 Unlinking message: ${messageId}`);

    const { data, error } = await supabase
        .from('messages')
        .update({ project_id: null })
        .eq('id', messageId)
        .select();

    if (error) {
        console.error('❌ Update failed:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Update success:', data[0]);
    } else {
        console.log('❌ 0 rows affected. Message might be gone or ID mismatch.');
    }
}

unlinkMessage();
