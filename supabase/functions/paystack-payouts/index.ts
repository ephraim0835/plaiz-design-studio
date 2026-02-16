
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
        const { project_id, worker_id, amount, platform_fee, recipient_code } = await req.json()
        const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!PAYSTACK_SECRET_KEY) throw new Error('Paystack Secret Key not configured')

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Trigger Paystack Transfer to Worker (80%)
        const workerTransferRes = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: 'balance',
                amount: Math.round(amount * 100), // Convert to kobo
                recipient: recipient_code,
                reason: `Worker Payment - Project ${project_id}`
            })
        })

        const workerTransferData = await workerTransferRes.json()

        if (!workerTransferData.status) {
            throw new Error(`Worker transfer failed: ${workerTransferData.message}`)
        }

        // 2. Trigger Paystack Transfer to Platform (20%)
        const PLATFORM_RECIPIENT_CODE = Deno.env.get('PLATFORM_RECIPIENT_CODE')
        let platformTransferData = null;

        if (PLATFORM_RECIPIENT_CODE && platform_fee > 0) {
            const platformTransferRes = await fetch('https://api.paystack.co/transfer', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: 'balance',
                    amount: Math.round(platform_fee * 100), // Convert to kobo
                    recipient: PLATFORM_RECIPIENT_CODE,
                    reason: `Platform Fee - Project ${project_id}`
                })
            })
            platformTransferData = await platformTransferRes.json()
        }

        // 3. Return Success
        return new Response(JSON.stringify({
            success: true,
            worker_transfer: workerTransferData.data,
            platform_transfer: platformTransferData?.data || null
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
