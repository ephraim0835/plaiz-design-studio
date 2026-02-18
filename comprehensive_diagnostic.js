// Final comprehensive diagnostic
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function comprehensiveDiagnostic() {
    console.log('🔍 COMPREHENSIVE PORTFOLIO DIAGNOSTIC\n')
    console.log('='.repeat(60))

    // 1. Check if portfolio table exists
    console.log('\n1️⃣ Checking portfolio table existence...')
    const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio')
        .select('count')
        .limit(1)

    if (portfolioError) {
        console.error('❌ Portfolio table error:', portfolioError.message)
        console.log('\n⚠️  The portfolio table might not exist!')
        console.log('Please run the portfolio_system_sync.sql script in Supabase SQL Editor')
        return
    }

    console.log('✅ Portfolio table exists')

    // 2. Count total items
    console.log('\n2️⃣ Counting portfolio items...')
    const { count, error: countError } = await supabase
        .from('portfolio')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error('❌ Count error:', countError.message)
    } else {
        console.log(`✅ Total items in database: ${count}`)
    }

    // 3. Check approved items
    console.log('\n3️⃣ Checking approved items...')
    const { data: approvedItems, error: approvedError } = await supabase
        .from('portfolio')
        .select('id, title, is_approved, is_featured')
        .eq('is_approved', true)

    if (approvedError) {
        console.error('❌ Approved items error:', approvedError.message)
    } else {
        console.log(`✅ Approved items: ${approvedItems?.length || 0}`)
        if (approvedItems && approvedItems.length > 0) {
            approvedItems.forEach((item, i) => {
                console.log(`   ${i + 1}. ${item.title} (featured: ${item.is_featured})`)
            })
        }
    }

    // 4. Test the EXACT query from GalleryTab (with fixed profiles join)
    console.log('\n4️⃣ Testing EXACT GalleryTab query...')
    let query = supabase.from('portfolio').select(`
        *,
        profiles:worker_id (
            full_name
        )
    `)
    query = query.eq('is_approved', true)
    const { data: galleryData, error: galleryError } = await query.order('created_at', { ascending: false })

    if (galleryError) {
        console.error('❌ Gallery query error:', galleryError.message)
        console.error('Full error:', JSON.stringify(galleryError, null, 2))
    } else {
        console.log(`✅ Gallery query successful: ${galleryData?.length || 0} items`)
        if (galleryData && galleryData.length > 0) {
            console.log('\n📋 Sample item structure:')
            const sample = galleryData[0]
            console.log({
                id: sample.id,
                title: sample.title,
                service_type: sample.service_type,
                is_approved: sample.is_approved,
                is_featured: sample.is_featured,
                worker_name: sample.profiles?.full_name || 'N/A',
                has_image_url: !!sample.image_url
            })
        }
    }

    // 5. Check RLS policies
    console.log('\n5️⃣ Checking RLS policies...')
    console.log('Note: Using ANON key, so RLS policies should allow public SELECT')

    console.log('\n' + '='.repeat(60))
    console.log('\n📊 SUMMARY:')
    console.log(`   - Portfolio table: ${portfolioError ? '❌ Missing' : '✅ Exists'}`)
    console.log(`   - Total items: ${count || 0}`)
    console.log(`   - Approved items: ${approvedItems?.length || 0}`)
    console.log(`   - Query works: ${galleryError ? '❌ No' : '✅ Yes'}`)

    if (!galleryError && galleryData && galleryData.length > 0) {
        console.log('\n✅ DATA IS ACCESSIBLE - Frontend should be able to fetch it!')
        console.log('\nIf the gallery is still empty, the issue is likely:')
        console.log('   1. Frontend code changes not loaded (restart dev server)')
        console.log('   2. Browser cache (hard refresh: Ctrl+Shift+R)')
        console.log('   3. JavaScript error in console (check browser DevTools)')
    } else {
        console.log('\n❌ DATA IS NOT ACCESSIBLE - There is a backend issue')
    }
}

comprehensiveDiagnostic()
