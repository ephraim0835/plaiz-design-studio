import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugAssignment() {
    // Get the stuck project
    const { data: projects } = await supabase
        .from('projects')
        .select('id, status, worker_id')
        .eq('status', 'NO_WORKER_AVAILABLE')
        .limit(1)

    if (!projects?.length) {
        console.log('No stuck projects found. Try matching state.')
        const { data: p2 } = await supabase.from('projects').select('id, status, worker_id').limit(1)
        console.log('Latest project:', p2?.[0])
        return
    }

    const project = projects[0]
    console.log('Target project:', project)

    // Get a worker to test with
    const { data: workers } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['graphic_designer', 'web_designer', 'print_specialist'])
        .limit(1)

    if (!workers?.length) { console.log('No workers found'); return }
    const worker = workers[0]
    console.log('Test worker:', worker)

    // Test 1: Basic update WITHOUT assignment_method (to check if that column is the problem)
    const { error: e1 } = await supabase
        .from('projects')
        .update({ status: 'in_progress', worker_id: worker.id })
        .eq('id', project.id)
    console.log('\nTest 1 (update without assignment_method):', e1 ? `ERROR: ${e1.message}` : 'SUCCESS ✅')

    // Restore original status
    await supabase.from('projects').update({ status: 'NO_WORKER_AVAILABLE', worker_id: null }).eq('id', project.id)

    // Test 2: Update WITH assignment_method (to check if column exists)
    const { error: e2 } = await supabase
        .from('projects')
        .update({ status: 'in_progress', worker_id: worker.id, assignment_method: 'admin_override' })
        .eq('id', project.id)
    console.log('Test 2 (update with assignment_method):', e2 ? `ERROR: ${e2.message}` : 'SUCCESS ✅')

    // Restore
    await supabase.from('projects').update({ status: 'NO_WORKER_AVAILABLE', worker_id: null }).eq('id', project.id)

    // Test 3: Check if increment RPC exists
    const { error: e3 } = await supabase.rpc('increment_worker_active_projects', { worker_id_param: worker.id })
    console.log('Test 3 (increment RPC):', e3 ? `ERROR: ${e3.message}` : 'SUCCESS ✅')
}

debugAssignment()
