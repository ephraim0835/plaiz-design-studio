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
    try {
        const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
        if (!RESEND_API_KEY) {
            console.warn('VITE_RESEND_API_KEY not found. Email not sent.');
            return;
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Plaiz Studio <notifications@plaiz.studio>',
                to: 'stickanimation007@gmail.com',
                subject: `New ${role.replace('_', ' ')} Registration Request`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                        <h2 style="color: #2563eb;">New Registration Request</h2>
                        <p>Someone has requested to join <strong>Plaiz Studio</strong> as a <strong>${role.replace('_', ' ')}</strong>.</p>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin-top: 0;"><strong>Requester Email:</strong> ${requesterEmail}</p>
                            <p style="margin-bottom: 0;"><strong>Access Code:</strong> <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: 2px;">${code}</span></p>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b;">This code expires in 24 hours. Please share it with the requester to complete their registration.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8;">Sent via Plaiz Studio Automation</p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to send email');
        }

        console.log('Invite code email sent successfully');
    } catch (err) {
        console.error('Error sending invite code email:', err);
    }
}
