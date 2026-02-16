/**
 * SUPABASE AUTH USER CREATION SCRIPT
 * 
 * This script creates auth.users accounts for all mock test users.
 * Run this BEFORE running seed_mock_users.sql
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install @supabase/supabase-js
 * 2. Set your Supabase credentials in .env file
 * 3. Run: node Backend/create_auth_users.js
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You need to add this to .env

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file')
    console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const mockUsers = [
    // Admin
    {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@test.com',
        password: 'Admin123!',
        role: 'admin',
        full_name: 'Admin User'
    },
    // Workers
    {
        id: '00000000-0000-0000-0000-000000000011',
        email: 'worker1@test.com',
        password: 'Worker123!',
        role: 'graphic_designer',
        full_name: 'Sarah Martinez'
    },
    {
        id: '00000000-0000-0000-0000-000000000012',
        email: 'worker2@test.com',
        password: 'Worker123!',
        role: 'web_designer',
        full_name: 'James Chen'
    },
    {
        id: '00000000-0000-0000-0000-000000000013',
        email: 'worker3@test.com',
        password: 'Worker123!',
        role: 'graphic_designer',
        full_name: 'Emily Rodriguez'
    },
    {
        id: '00000000-0000-0000-0000-000000000014',
        email: 'worker4@test.com',
        password: 'Worker123!',
        role: 'graphic_designer',
        full_name: 'Michael Thompson'
    },
    {
        id: '00000000-0000-0000-0000-000000000015',
        email: 'worker5@test.com',
        password: 'Worker123!',
        role: 'graphic_designer',
        full_name: 'Olivia Parker'
    },
    // Clients
    {
        id: '00000000-0000-0000-0000-000000000021',
        email: 'client1@test.com',
        password: 'Client123!',
        role: 'client',
        full_name: 'David Anderson'
    },
    {
        id: '00000000-0000-0000-0000-000000000022',
        email: 'client2@test.com',
        password: 'Client123!',
        role: 'client',
        full_name: 'Jennifer Lee'
    },
    {
        id: '00000000-0000-0000-0000-000000000023',
        email: 'client3@test.com',
        password: 'Client123!',
        role: 'client',
        full_name: 'Robert Williams'
    },
    {
        id: '00000000-0000-0000-0000-000000000024',
        email: 'client4@test.com',
        password: 'Client123!',
        role: 'client',
        full_name: 'Maria Garcia'
    },
    {
        id: '00000000-0000-0000-0000-000000000025',
        email: 'client5@test.com',
        password: 'Client123!',
        role: 'client',
        full_name: 'Thomas Brown'
    }
]

async function createMockUsers() {
    console.log('🚀 Starting mock user creation...\n')

    const results = {
        success: [],
        failed: [],
        skipped: []
    }

    for (const user of mockUsers) {
        try {
            console.log(`Creating user: ${user.email}...`)

            // Create auth user with admin API
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    full_name: user.full_name,
                    role: user.role
                }
            })

            if (error) {
                if (error.message.includes('already registered')) {
                    console.log(`⚠️  User ${user.email} already exists, skipping...`)
                    results.skipped.push(user.email)
                } else {
                    console.error(`❌ Failed to create ${user.email}:`, error.message)
                    results.failed.push({ email: user.email, error: error.message })
                }
            } else {
                console.log(`✅ Successfully created ${user.email} (ID: ${data.user.id})`)
                results.success.push(user.email)
            }
        } catch (err) {
            console.error(`❌ Exception creating ${user.email}:`, err.message)
            results.failed.push({ email: user.email, error: err.message })
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 CREATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successfully created: ${results.success.length}`)
    console.log(`⚠️  Skipped (already exist): ${results.skipped.length}`)
    console.log(`❌ Failed: ${results.failed.length}`)

    if (results.success.length > 0) {
        console.log('\n✅ Successfully created users:')
        results.success.forEach(email => console.log(`   - ${email}`))
    }

    if (results.skipped.length > 0) {
        console.log('\n⚠️  Skipped users (already exist):')
        results.skipped.forEach(email => console.log(`   - ${email}`))
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed users:')
        results.failed.forEach(({ email, error }) => console.log(`   - ${email}: ${error}`))
    }

    console.log('\n' + '='.repeat(60))
    console.log('📝 NEXT STEPS:')
    console.log('='.repeat(60))
    console.log('1. Run the SQL script: Backend/seed_mock_users.sql')
    console.log('2. This will populate profiles and worker_stats tables')
    console.log('3. You can now log in with any of these accounts!')
    console.log('\n📧 Login Credentials:')
    console.log('   Admin:   admin@test.com / Admin123!')
    console.log('   Workers: worker1-5@test.com / Worker123!')
    console.log('   Clients: client1-5@test.com / Client123!')
    console.log('='.repeat(60) + '\n')
}

// Run the script
createMockUsers()
    .then(() => {
        console.log('✨ Script completed!')
        process.exit(0)
    })
    .catch((err) => {
        console.error('💥 Script failed:', err)
        process.exit(1)
    })
