// Check profiles table schema
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function checkProfilesSchema() {
    console.log('🔍 Checking profiles table schema...\n')

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error:', error.message)
        return
    }

    if (data && data.length > 0) {
        console.log('✅ Sample profile:')
        console.log(JSON.stringify(data[0], null, 2))
        console.log('\n📋 Available columns:')
        Object.keys(data[0]).forEach(key => {
            console.log(`  - ${key}`)
        })
    } else {
        console.log('⚠️  No profiles found')
    }
}

checkProfilesSchema()
