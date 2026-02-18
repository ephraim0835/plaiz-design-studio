// Test the FIXED query
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function testFixedQuery() {
    console.log('🧪 Testing FIXED query (without avatar_url)...\n')

    let query = supabase.from('portfolio').select(`
        *,
        profiles:worker_id (
            full_name
        )
    `)

    query = query.eq('is_approved', true)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('❌ ERROR:', error.message)
        console.error('Details:', JSON.stringify(error, null, 2))
        return
    }

    console.log(`✅ SUCCESS! Found ${data?.length || 0} items\n`)

    if (data && data.length > 0) {
        console.log('📋 Sample items:')
        data.slice(0, 3).forEach((item, i) => {
            console.log(`\n${i + 1}. ${item.title}`)
            console.log(`   - service_type: ${item.service_type}`)
            console.log(`   - is_featured: ${item.is_featured}`)
            console.log(`   - worker: ${item.profiles?.full_name || 'N/A'}`)
        })
        console.log(`\n... and ${data.length - 3} more items`)
    }
}

testFixedQuery()
