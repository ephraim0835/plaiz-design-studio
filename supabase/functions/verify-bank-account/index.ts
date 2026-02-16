
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, bank_code, account_number } = await req.json()
        const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

        if (!PAYSTACK_SECRET_KEY) {
            throw new Error('Paystack Secret Key not configured')
        }

        // LIST BANKS
        if (action === 'list_banks') {
            const response = await fetch('https://api.paystack.co/bank?currency=NGN', {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            })

            const data = await response.json()
            if (!data.status) throw new Error(data.message || 'Failed to fetch banks')

            return new Response(JSON.stringify(data.data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // VERIFY ACCOUNT & CREATE RECIPIENT
        if (action === 'verify_account') {
            if (!bank_code || !account_number) {
                throw new Error('Bank code and account number are required')
            }

            // 1. Resolve Account
            const response = await fetch(
                `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    },
                }
            )

            const data = await response.json()

            if (!data.status) {
                return new Response(
                    JSON.stringify({ error: data.message || 'Could not verify account name' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const resolvedAccount = data.data;

            // 2. Create Transfer Recipient (needed for payouts)
            let recipientCode = null;
            try {
                const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'nuban',
                        name: resolvedAccount.account_name,
                        account_number: account_number,
                        bank_code: bank_code,
                        currency: 'NGN'
                    })
                });
                const recipientData = await recipientRes.json();
                if (recipientData.status) {
                    recipientCode = recipientData.data.recipient_code;
                }
            } catch (e) {
                console.error('Failed to create recipient code', e);
            }

            return new Response(JSON.stringify({
                ...resolvedAccount,
                recipient_code: recipientCode
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error('Invalid action')

    } catch (err: any) {
        console.error('Edge Function Error:', err.message)
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
            status: err.status || 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
