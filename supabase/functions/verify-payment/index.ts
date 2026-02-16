
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { reference, project_id, phase } = await req.json()
        const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!PAYSTACK_SECRET_KEY) throw new Error('Paystack Secret Key not configured in Supabase')
        if (!reference) throw new Error('Transaction reference is required')

        // 1. Verify Transaction with Paystack
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            }
        })

        const verifyData = await verifyRes.json()

        if (!verifyData.status || verifyData.data.status !== 'success') {
            throw new Error(`Payment verification failed: ${verifyData.message || 'Invalid transaction'}`)
        }

        const paidAmount = verifyData.data.amount / 100; // Convert kobo to NGN

        // 2. Update Database via Service Role (Bypass RLS)
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        console.log(`📡 Verifying payment for Project: ${project_id}, Phase: ${phase}`)

        // Attempt the preferred 5-argument signature (Phase-Aware)
        let { data, error } = await supabase.rpc('process_client_payment_success', {
            p_project_id: project_id,
            p_client_id: verifyData.data.metadata?.client_id || null,
            p_transaction_ref: reference,
            p_amount: paidAmount,
            p_phase: phase
        })

        // Fallback: If 5-arg signature is missing, use the legacy 4-arg one
        if (error && (error.code === 'PGRST202' || error.message?.includes('varying[]'))) {
            console.log('⚠️ RPC v2 (5-arg) not found. Falling back to v1 (4-arg) signature...')

            const fallback = await supabase.rpc('process_client_payment_success', {
                p_project_id: project_id,
                p_client_id: verifyData.data.metadata?.client_id || null,
                p_transaction_ref: reference,
                p_amount: paidAmount
            })

            error = fallback.error
            data = fallback.data

            // Manual Status Patch: 4-arg RPC doesn't know about phases or newer states
            if (!error && phase) {
                console.log(`🔧 Manually syncing project status for phase: ${phase}`)
                const targetStatus = phase === 'deposit_40' ? 'work_started' : 'completed'
                await supabase
                    .from('projects')
                    .update({
                        status: targetStatus,
                        total_paid: verifyData.data.amount / 100 // Best effort total paid sync
                    })
                    .eq('id', project_id)
            }
        }

        if (error) {
            console.error('RPC Execution Error:', error)
            throw error
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Payment verified and project updated',
            data: verifyData.data
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error('Verify Error:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
