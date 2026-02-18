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
            const { data, error: rpcError } = await supabase.rpc('confirm_agreement', {
                p_project_id: projectId,
                p_agreement_id: agreementId
            })

            if (rpcError) throw rpcError

            return new Response(JSON.stringify({ success: true, ...data }), { headers: { "Content-Type": "application/json" } })
        }

        if (action === 'trigger_reassignment') {
            const { data, error: rpcError } = await supabase.rpc('reject_price_proposal', {
                p_project_id: projectId,
                p_reason: reason || 'Reassignment requested by client'
            })

            if (rpcError) throw rpcError

            return new Response(JSON.stringify({ success: true, ...data }), {
                headers: { "Content-Type": "application/json" }
            })
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
