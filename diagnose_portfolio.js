// Diagnostic script to check portfolio data and RLS
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function diagnosePortfolio() {
    console.log('🔍 PORTFOLIO DIAGNOSTICS\n')

    // 1. Check raw data
    console.log('1️⃣ Checking raw portfolio data...')
    const { data: rawData, error: rawError } = await supabase
        .from('portfolio')
        .select('*')

    if (rawError) {
        console.error('❌ Error:', rawError.message)
        return
    }

    console.log(`✅ Found ${rawData?.length || 0} total items\n`)

    if (rawData && rawData.length > 0) {
        console.log('📊 Data breakdown:')
        rawData.forEach((item, i) => {
            console.log(`  ${i + 1}. "${item.title}"`)
            console.log(`     - is_approved: ${item.is_approved}`)
            console.log(`     - worker_id: ${item.worker_id || 'NULL'}`)
            console.log(`     - service_type: ${item.service_type}`)
        })
    }

    // 2. Check with is_approved filter (like GalleryTab does)
    console.log('\n2️⃣ Checking with is_approved=true filter...')
    const { data: approvedData, error: approvedError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('is_approved', true)

    if (approvedError) {
        console.error('❌ Error:', approvedError.message)
    } else {
        console.log(`✅ Found ${approvedData?.length || 0} approved items`)
    }

    // 3. Check with profiles join (exactly like GalleryTab)
    console.log('\n3️⃣ Checking with profiles join (like GalleryTab)...')
    const { data: joinedData, error: joinError } = await supabase
        .from('portfolio')
        .select(`
            *,
            profiles:worker_id (
                full_name,
                avatar_url
            )
        `)
        .eq('is_approved', true)

    if (joinError) {
        console.error('❌ Error with join:', joinError.message)
    } else {
        console.log(`✅ Found ${joinedData?.length || 0} items with join`)
        if (joinedData && joinedData.length > 0) {
            console.log('\n📋 Sample joined item:')
            console.log(JSON.stringify(joinedData[0], null, 2))
        }
    }

    // 4. Check profiles table
    console.log('\n4️⃣ Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .limit(5)

    if (profilesError) {
        console.error('❌ Error:', profilesError.message)
    } else {
        console.log(`✅ Found ${profiles?.length || 0} profiles`)
        profiles?.forEach(p => {
            console.log(`  - ${p.full_name} (${p.role}): ${p.id}`)
        })
    }
}

diagnosePortfolio()
