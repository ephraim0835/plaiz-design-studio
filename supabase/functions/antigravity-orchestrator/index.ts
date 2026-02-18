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
        const detectedRole = analysisData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Graphic Designer'

        // Clean up role (sometimes Gemini adds formatting)
        const validRoles = ['Graphic Designer', 'Web Designer', 'Print Specialist']
        const role = validRoles.find(r => detectedRole.includes(r)) || 'Graphic Designer'

        // 2. Update Project Type & Trigger Worker Matching RPC (V2)
        await supabase.from('projects').update({ project_type: role, status: 'matching' }).eq('id', projectId)

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

    } catch (error) {
        console.error('Orchestration Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
})
