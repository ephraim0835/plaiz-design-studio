// Quick script to verify portfolio table exists and has data
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function verifyPortfolio() {
    console.log('🔍 Checking portfolio table...\n')

    // Check if table exists and has data
    const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .limit(10)

    if (error) {
        console.error('❌ Error querying portfolio:', error.message)
        console.log('\nThis likely means the table doesn\'t exist or has wrong name.')

        // Try portfolio_items as fallback
        console.log('\n🔍 Checking portfolio_items table...\n')
        const { data: itemsData, error: itemsError } = await supabase
            .from('portfolio_items')
            .select('*')
            .limit(10)

        if (itemsError) {
            console.error('❌ portfolio_items also not found:', itemsError.message)
        } else {
            console.log('✅ Found portfolio_items table with', itemsData?.length || 0, 'items')
            console.log('Sample:', itemsData?.[0])
        }
        return
    }

    console.log('✅ Portfolio table exists!')
    console.log('📊 Total items:', data?.length || 0)

    if (data && data.length > 0) {
        console.log('\n📋 Sample item:')
        console.log(JSON.stringify(data[0], null, 2))

        console.log('\n📋 All items:')
        data.forEach((item, i) => {
            console.log(`${i + 1}. ${item.title} (${item.service_type}) - Featured: ${item.is_featured}`)
        })
    } else {
        console.log('⚠️  Table exists but is empty!')
    }
}

verifyPortfolio()
