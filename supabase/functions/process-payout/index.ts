// AUTOMATIC PAYOUT EDGE FUNCTION
// This processes worker payouts via Paystack Transfer API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { payout_log_id } = await req.json()
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get payout details
        const { data: payout, error: fetchError } = await supabase
            .from('payout_logs')
            .select('*')
            .eq('id', payout_log_id)
            .single()

        if (fetchError || !payout) {
            throw new Error('Payout not found')
        }

        if (payout.status !== 'ready_for_transfer') {
            throw new Error('Payout not ready for transfer')
        }

        // Initiate Paystack Transfer
        const transferData = {
            source: 'balance',
            amount: Math.round(payout.worker_cut * 100), // Convert to kobo
            recipient: payout.worker_bank_info.account_number,
            reason: `Payout for project ${payout.project_id}`,
        }

        const paystackResponse = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transferData),
        })

        const paystackData = await paystackResponse.json()

        if (!paystackData.status) {
            throw new Error(`Paystack transfer failed: ${paystackData.message}`)
        }

        // Update payout status
        await supabase
            .from('payout_logs')
            .update({
                status: 'transferred',
                transfer_reference: paystackData.data.reference,
                transferred_at: new Date().toISOString(),
            })
            .eq('id', payout_log_id)

        return new Response(JSON.stringify({
            success: true,
            transfer_reference: paystackData.data.reference,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error('Payout Error:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
