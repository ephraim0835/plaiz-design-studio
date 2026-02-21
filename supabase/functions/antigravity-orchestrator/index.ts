import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
    try {
        const { record } = await req.json()
        const { id: projectId, title, description } = record

        // 1. Project Analysis using Gemini 1.5 Flash
        const analysisPrompt = `Analyze this project brief for Plaiz Design Studio. 
        Classify the project into EXACTLY ONE role from these categories ONLY:
        - Graphic Designer (Logos, Flyers, Branding, Social Media)
        - Web Designer (Websites, Dashboards, UI/UX)
        - Print Specialist (Banners, Business Cards, Packaging, Clothing Prints)
        - NEEDS_ADMIN (If the request is ambiguous, lacks sufficient detail to classify confidently, or requires expert human judgment)
        - Unserviceable (If the request is clearly spam, gibberish, illegal, or completely outside design/dev scope)
        
        Title: ${title}
        Description: ${description}
        
        Return ONLY the role name as plain text (e.g. Graphic Designer).`

        const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: analysisPrompt
                    }]
                }]
            })
        })

        const analysisData = await analysisResponse.json()
        const rawRole = analysisData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'NEEDS_ADMIN'

        // 1.5 Map Gemini roles to db-friendly snake_case
        const roleMapping: Record<string, string> = {
            'Graphic Designer': 'graphic_designer',
            'Web Designer': 'web_designer',
            'Print Specialist': 'print_specialist',
            'NEEDS_ADMIN': 'NEEDS_ADMIN',
            'Unserviceable': 'unserviceable'
        }

        const role = roleMapping[rawRole as keyof typeof roleMapping] || 'NEEDS_ADMIN'

        if (role === 'unserviceable') {
            await supabase.from('projects').update({
                project_type: 'other',
                status: 'cancelled',
                rejection_reason: 'AI classification: Request deemed unserviceable (spam, vague, or out of scope).'
            }).eq('id', projectId)

            console.log(`V2 Orchestration BLOCKED: Project ${projectId} is Unserviceable.`)
            return new Response(JSON.stringify({ success: false, reason: 'Unserviceable' }), {
                headers: { "Content-Type": "application/json" },
            })
        }

        if (role === 'NEEDS_ADMIN') {
            await supabase.from('projects').update({
                status: 'flagged',
                rejection_reason: 'AI classification: Ambiguous request flagged for Admin Review.'
            }).eq('id', projectId)

            // Notify Admins
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
            if (admins) {
                await Promise.all(admins.map(admin =>
                    supabase.from('notifications').insert({
                        user_id: admin.id,
                        title: 'New Project: Admin Review Needed',
                        message: `Project "${title}" was flagged for manual classification.`,
                        type: 'admin_mediation',
                        project_id: projectId
                    })
                ))
            }

            console.log(`V2 Orchestration PAUSED: Project ${projectId} flagged for Admin Review.`)
            return new Response(JSON.stringify({ success: true, status: 'flagged' }), {
                headers: { "Content-Type": "application/json" },
            })
        }

        // 2. Update Project Type & Trigger Worker Matching RPC (V2)
        await supabase.from('projects').update({
            project_type: role,
            status: 'matching'
        }).eq('id', projectId)

        const { data: workerId, error: matchError } = await supabase.rpc('match_worker_v2', {
            p_role: role,
            p_project_id: projectId
        })

        if (matchError) throw matchError

        // 3. Log Orchestration Success
        console.log(`V2 Orchestration SUCCESS: Project ${projectId}. Role: ${role}. Assigned Worker: ${workerId || 'NONE_AVAILABLE'}`)

        return new Response(JSON.stringify({ success: true, role, workerId }), {
            headers: { "Content-Type": "application/json" },
        })

    } catch (error: any) {
        console.error('Orchestration Error:', error.message)

        // Safety Fallback: Set to NO_WORKER_AVAILABLE so it's not "stuck"
        try {
            const { record } = await req.clone().json()
            await supabase.from('projects')
                .update({ status: 'NO_WORKER_AVAILABLE', rejection_reason: `Orchestration Error: ${error.message}` })
                .eq('id', record.id)
        } catch (fallbackError) {
            console.error('Critical Fail: Could not reset project status:', fallbackError)
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
})
