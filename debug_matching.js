import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugMatching() {
    console.log('--- LATEST PROJECTS ---')
    const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5)
    projects?.forEach(p => console.log(`ID: ${p.id.slice(0, 8)} | Status: ${p.status} | Type: ${p.project_type} | Title: ${p.title}`))

    console.log('\n--- VERIFIED WORKERS ---')
    const roles = ['graphic_designer', 'web_designer', 'print_specialist']
    for (const r of roles) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', r).eq('verification_status', 'VERIFIED')
        console.log(`${r}: ${count || 0}`)
    }
}
debugMatching()
