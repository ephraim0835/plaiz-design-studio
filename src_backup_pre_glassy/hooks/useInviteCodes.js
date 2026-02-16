import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useInviteCodes = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Generate a random 6-digit code
    const generateCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString()
    }

    // Request an invite code
    const requestInviteCode = async (email, role) => {
        setLoading(true)
        setError(null)

        try {
            const code = generateCode()
            const expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours from now

            // Insert code into database
            const { data, error: insertError } = await supabase
                .from('invite_codes')
                .insert([
                    {
                        code,
                        role,
                        email,
                        expires_at: expiresAt.toISOString(),
                        used: false
                    }
                ])
                .select()

            if (insertError) throw insertError

            // Send email notification (we'll implement this via Supabase Edge Function or external service)
            // For now, we'll call a placeholder function
            await sendInviteCodeEmail(email, role, code)

            setLoading(false)
            return { success: true, data, code }
        } catch (err) {
            console.error('Error requesting invite code:', err)
            setError(err.message)
            setLoading(false)
            return { success: false, error: err.message }
        }
    }

    // Verify an invite code
    const verifyInviteCode = async (code, email) => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('invite_codes')
                .select('*')
                .eq('code', code)
                .eq('email', email)
                .eq('used', false)
                .single()

            if (fetchError) throw new Error('Invalid or expired code')

            // Check if code is expired
            const expiresAt = new Date(data.expires_at)
            const now = new Date()

            if (now > expiresAt) {
                throw new Error('This code has expired')
            }

            // Mark code as used
            const { error: updateError } = await supabase
                .from('invite_codes')
                .update({ used: true })
                .eq('id', data.id)

            if (updateError) throw updateError

            setLoading(false)
            return { success: true, role: data.role }
        } catch (err) {
            console.error('Error verifying invite code:', err)
            setError(err.message)
            setLoading(false)
            return { success: false, error: err.message }
        }
    }

    return { requestInviteCode, verifyInviteCode, loading, error }
}

// Placeholder function for sending email
// This should be replaced with actual email service integration
const sendInviteCodeEmail = async (requesterEmail, role, code) => {
    // TODO: Implement email sending via Supabase Edge Function or external service
    // For now, we'll just log it
    console.log(`
        ========================================
        INVITE CODE EMAIL
        ========================================
        To: stickanimation007@gmail.com
        Subject: New ${role} Registration Request
        
        Someone has requested to register as a ${role}.
        
        Requester Email: ${requesterEmail}
        Invite Code: ${code}
        Expires: 24 hours from now
        
        Please share this code with the requester to complete their registration.
        ========================================
    `)

    // In production, you would call your email service here
    // Example with Supabase Edge Function:
    // const { data, error } = await supabase.functions.invoke('send-invite-email', {
    //     body: { to: 'ofoli.ephraim2008@gmail.com', requesterEmail, role, code }
    // })

    return Promise.resolve()
}
