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
        Identify the primary required skill.
        Choose EXACTLY ONE from: graphic_design, web_design, printing.
        
        Title: ${title}
        Description: ${description}
        
        Return ONLY the category ID name.`

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
        const detectedSkill = analysisData.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase()?.trim() || 'graphic_design'

        // 2. Update Project Type & Trigger Worker Matching RPC
        await supabase.from('projects').update({ project_type: detectedSkill }).eq('id', projectId)

        const { data: workerId, error: matchError } = await supabase.rpc('match_worker_to_project', {
            p_skill: detectedSkill,
            p_project_id: projectId
        })

        if (matchError) throw matchError

        // 3. Log Orchestration Success
        console.log(`Successfully orchestrated project ${projectId}. Detected Skill: ${detectedSkill}. Assigned Worker: ${workerId}`)

        return new Response(JSON.stringify({ success: true, skill: detectedSkill, workerId }), {
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
