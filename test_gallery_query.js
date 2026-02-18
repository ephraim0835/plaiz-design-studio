// Test the exact query that GalleryTab.tsx uses
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function testGalleryQuery() {
    console.log('🧪 Testing EXACT GalleryTab query...\n')

    // This is the EXACT query from GalleryTab.tsx line 38-48
    let query = supabase.from('portfolio').select(`
        *,
        profiles:worker_id (
            full_name,
            avatar_url
        )
    `)

    query = query.eq('is_approved', true)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('❌ ERROR:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return
    }

    console.log(`✅ Query successful!`)
    console.log(`📊 Items returned: ${data?.length || 0}\n`)

    if (data && data.length > 0) {
        console.log('📋 Items:')
        data.forEach((item, i) => {
            console.log(`\n${i + 1}. ${item.title}`)
            console.log(`   - service_type: ${item.service_type}`)
            console.log(`   - is_approved: ${item.is_approved}`)
            console.log(`   - is_featured: ${item.is_featured}`)
            console.log(`   - worker_id: ${item.worker_id || 'NULL'}`)
            console.log(`   - profiles: ${item.profiles ? item.profiles.full_name : 'NULL'}`)
            console.log(`   - image_url: ${item.image_url?.substring(0, 50)}...`)
        })
    } else {
        console.log('⚠️  No items returned!')
        console.log('\nPossible reasons:')
        console.log('1. RLS policy is blocking the query')
        console.log('2. All items have is_approved = false')
        console.log('3. The join with profiles is failing')
    }
}

testGalleryQuery()
