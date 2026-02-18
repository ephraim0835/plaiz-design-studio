import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
    try {
        const { action, projectId, agreementId, reason } = await req.json()

        // 1. Fetch Project Details for Type Detection
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*, agreements(*)')
            .eq('id', projectId)
            .single()

        if (projectError) throw projectError

        if (action === 'accept_proposal') {
            // Calculate Splits based on project type
            const isPrinting = project.skill === 'printing'
            const totalAmount = project.agreements.find(a => a.id === agreementId)?.amount || 0

            const { data: splits } = await supabase.rpc('calculate_project_splits', {
                p_total: totalAmount,
                p_type: isPrinting ? 'printing' : 'digital'
            })

            // Lock financial shares and move to payment stage
            await supabase.from('projects').update({
                payout_worker_share: splits.worker_share,
                payout_platform_share: splits.platform_share,
                status: isPrinting ? 'awaiting_payment' : 'awaiting_deposit'
            }).eq('id', projectId)

            return new Response(JSON.stringify({ success: true, splits }), { headers: { "Content-Type": "application/json" } })
        }

        if (action === 'trigger_reassignment') {
            // Logic for triggering auto-reassignment
            const newReassignmentCount = (project.reassignment_count || 0) + 1

            // Update reassignment count and reset worker
            await supabase.from('projects').update({
                reassignment_count: newReassignmentCount,
                worker_id: null,
                status: 'queued'
            }).eq('id', projectId)

            // Penalty logic for excessive reassignments
            if (newReassignmentCount >= 3) {
                // Flag for Admin Mediation
                console.warn(`Project ${projectId} flagged for manual mediation after ${newReassignmentCount} reassignments.`)
            }

            return new Response(JSON.stringify({ success: true, count: newReassignmentCount }), { headers: { "Content-Type": "application/json" } })
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
