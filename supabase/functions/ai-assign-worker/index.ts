import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

// Standard Deno/Supabase types for linting
declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const LLM_API_KEY = Deno.env.get('LLM_API_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface SelectionResponse {
    selected_worker_id: string;
    confidence_score: number;
    reasoning: {
        skill_match: string;
        experience: string;
        workload: string;
    };
}

serve(async (req: Request) => {
    try {
        const { project_id } = await req.json()

        if (!project_id) {
            return new Response(JSON.stringify({ error: 'project_id is required' }), { status: 400 })
        }

        // 1. Fetch Project Details
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', project_id)
            .single()

        if (projectError || !project) {
            return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 })
        }

        // 2. Eligibility Guardrails with new Priority System
        const { data: eligibleWorkers, error: workersError } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                minimum_price,
                worker_stats (
                  average_rating,
                  completed_projects,
                  active_projects,
                  max_projects_limit,
                  is_probation,
                  skills,
                  last_assignment_at
                )
            `)
            .eq('role', 'worker')
            .eq('is_verified', true)
            .eq('is_available', true)

        if (workersError) throw workersError

        // Extraction and Sorting for Fairness (those who worked longest ago go first)
        const finalEligibleWorkers = eligibleWorkers
            .filter((w: any) => {
                const stats = w.worker_stats?.[0] || w.worker_stats
                if (!stats || stats.is_probation) return false

                // 1. Filter by required skill
                const matchesCategory = w.worker_stats?.skills?.includes(project.project_type) || false

                // 2. Skip workers with no minimum_price
                const hasMinPrice = w.minimum_price !== null && w.minimum_price !== undefined

                // 3. Skip workers whose minimum_price > client budget
                // Parsing budget from string "₦50k - ₦200k" or "Under ₦50k"
                const budgetStr = project.assignment_metadata?.budget_range || "0"
                const budgetValue = parseInt(budgetStr.replace(/[^0-9]/g, "")) * (budgetStr.includes('k') ? 1000 : 1)
                const budgetMatch = hasMinPrice ? w.minimum_price <= budgetValue : false

                const hasCapacity = (stats.active_projects || 0) < (stats.max_projects_limit || 3)

                return hasCapacity && matchesCategory && hasMinPrice && budgetMatch
            })
            .sort((a: any, b: any) => {
                // 4. Fairness rotation: Sort by last assignment date
                const dateA = a.worker_stats?.last_assignment_at || '1970-01-01'
                const dateB = b.worker_stats?.last_assignment_at || '1970-01-01'
                return dateA < dateB ? -1 : 1
            })

        if (finalEligibleWorkers.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                status: 'pending',
                message: 'No eligible specialists found within budget constraints.'
            }), { status: 200 })
        }

        // 3. AI Evaluation
        const prompt = `
            Evaluate which worker is most suitable for this project:
            
            Project: ${project.title} (${project.service_type})
            Description: ${project.description}

            Eligible Workers:
            ${JSON.stringify(finalEligibleWorkers.map((w: any) => ({
            id: w.id,
            name: w.full_name,
            skills: w.worker_stats?.skills,
            active: w.worker_stats?.active_projects
        })))}

            Return JSON: { "selected_worker_id": "uuid", "confidence_score": 0.0, "reasoning": { "skill_match": "...", "experience": "...", "workload": "..." } }
        `

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            })
        })

        const aiResult = await aiResponse.json()
        const selection: SelectionResponse = JSON.parse(aiResult.choices[0].message.content)

        // 4. Verification & Execution
        const selectedWorker = finalEligibleWorkers.find((w: any) => w.id === selection.selected_worker_id)
        if (!selectedWorker) throw new Error('AI selected invalid worker')

        await supabase.from('projects').update({
            worker_id: selection.selected_worker_id,
            status: 'in_progress',
            assignment_metadata: selection
        }).eq('id', project_id)

        await supabase.rpc('increment_worker_active_projects', { worker_id_param: selection.selected_worker_id })

        // Initial Chat Message
        await supabase.from('messages').insert({
            project_id,
            sender_id: selection.selected_worker_id,
            content: `Hello! I've been assigned to your project "${project.title}". I'm ready to begin!`
        })

        await supabase.from('assignment_logs').insert({ project_id, details: selection })

        return new Response(JSON.stringify({
            success: true,
            worker_id: selection.selected_worker_id,
            worker_name: selectedWorker.full_name, // Added worker name
            reasoning: selection.reasoning
        }), { status: 200 })

    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500 })
    }
})
