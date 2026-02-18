// Test simpler query without profiles join
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function testSimpleQuery() {
    console.log('🧪 Testing SIMPLE query (no join)...\n')

    const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('❌ ERROR:', error.message)
        return
    }

    console.log(`✅ Success! Found ${data?.length || 0} items\n`)

    if (data && data.length > 0) {
        data.forEach((item, i) => {
            console.log(`${i + 1}. ${item.title} (${item.service_type})`)
        })
    }
}

testSimpleQuery()
