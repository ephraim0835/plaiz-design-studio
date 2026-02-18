import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Project, ProjectStatus } from '../types'

interface ProjectFilter {
    client_id?: string;
    worker_id?: string;
    category?: string;
    status?: ProjectStatus;
    unassigned?: boolean;
}

// Add userRole and userId parameters for permission enforcement
export const useProjects = (filter: ProjectFilter = {}, userRole?: string, userId?: string) => {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const isMountedRef = useRef(true)

    const fetchProjects = async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            let query = supabase
                .from('projects')
                .select('*, last_message:messages(content, created_at, sender_id, profiles(full_name))')
                .order('created_at', { ascending: false })
                .order('created_at', { foreignTable: 'messages', ascending: false })
                .limit(1, { foreignTable: 'messages' })

            // Security: Workers should ONLY see projects assigned to them
            // This is a frontend filter, but RLS should also be enforced on backend
            if (userRole && ['graphic_designer', 'web_designer', 'designer', 'developer', 'print_specialist', 'video_editor', 'worker'].includes(userRole)) {
                if (userId) {
                    query = query.eq('worker_id', userId)
                }
            }

            if (filter.client_id) {
                query = query.eq('client_id', filter.client_id)
            }
            if (filter.worker_id) {
                query = query.eq('worker_id', filter.worker_id)
            }
            if (filter.unassigned) {
                query = query.is('worker_id', null)
            }
            if (filter.category) {
                query = query.or(`category.eq."${filter.category}",project_type.eq."${filter.category}"`)
            }
            if (filter.status) {
                query = query.eq('status', filter.status)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            // Map data to ensure it matches the Project interface
            const mappedData: Project[] = (data || []).map((p: any) => ({
                id: p.id,
                client_id: p.client_id,
                title: p.title || p.name || 'Untitled Project',
                description: p.description || '',
                status: p.status as ProjectStatus,
                project_type: p.project_type || p.category || 'graphic_design',
                assignment_metadata: p.assignment_metadata || {},
                worker_id: p.worker_id,
                created_at: p.created_at,
                updated_at: p.updated_at || p.created_at,
                last_message: p.last_message && p.last_message[0] ? {
                    content: p.last_message[0].content,
                    created_at: p.last_message[0].created_at,
                    sender_id: p.last_message[0].sender_id,
                    sender_name: p.last_message[0].profiles?.full_name
                } : undefined
            }))

            if (isMountedRef.current) {
                setProjects(mappedData)
            }
        } catch (err: any) {
            console.error('Error fetching projects:', err)
            if (isMountedRef.current) {
                setError(err.message)
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        isMountedRef.current = true
        fetchProjects()

        // Subscribe to changes
        const subscription = supabase
            .channel('projects-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                fetchProjects(true) // Silent refresh
            })
            // Listen for new messages to update last_message preview in real-time
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                fetchProjects(true) // Silent refresh
            })
            .subscribe()

        return () => {
            isMountedRef.current = false
            subscription.unsubscribe()
        }
    }, [JSON.stringify(filter)])

    const updateProject = async (projectId: string, updates: Partial<Project>) => {
        try {
            const { error: updateError } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', projectId)

            if (updateError) throw updateError

            // Portfolio Autosave Logic (Projects -> Portfolio)
            if (updates.status === 'completed') {
                const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
                if (project) {
                    await supabase.from('portfolio').insert({
                        project_id: projectId,
                        worker_id: project.worker_id,
                        title: project.title,
                        description: project.description,
                        service_type: project.project_type,
                        // Attempt to find latest deliverable, or fallback to placeholder
                        image_url: '', // No default stock image
                        is_approved: false // Admin must approve before public
                    });
                }
            }

            return { success: true }
        } catch (err: any) {
            console.error('Error updating project:', err)
            return { success: false, error: err.message }
        }
    }

    const createProject = async (projectData: Partial<Project>) => {
        try {
            // 1. Insert the project
            const { data, error: insertError } = await supabase
                .from('projects')
                .insert([
                    {
                        ...projectData,
                        created_at: new Date().toISOString(),
                        status: 'matching' // Default status for AI-first orchestration
                    }
                ])
                .select()
                .single()

            if (insertError) throw insertError

            // 2. Attempt Auto-Assignment (New Format: AI Fair Rotation)
            if (data && data.status === 'matching' && !data.worker_id) {
                try {
                    const projectBudget = data.assignment_metadata?.budget_ngn || 0;

                    // Normalize skill for the matching algorithm
                    let skill = data.project_type || 'graphic_design';
                    if (skill === 'graphic_design') skill = 'graphics';
                    if (skill === 'web_design') skill = 'web';

                    const { error: rpcError } = await supabase
                        .rpc('match_worker_to_project', {
                            p_project_id: data.id,
                            p_skill: skill,
                            p_budget: projectBudget
                        });

                    if (rpcError) {
                        console.error('Matching Error:', rpcError);
                        // Fallback to queued if database error occurs
                        await supabase
                            .from('projects')
                            .update({ status: 'matching' })
                            .eq('id', data.id);
                    }
                } catch (assignErr) {
                    console.warn('Auto-assignment failed (silent fail):', assignErr);
                }
            }

            return { success: true, data }
        } catch (err: any) {
            console.error('Error creating project:', err)
            return { success: false, error: err.message }
        }
    }

    return { projects, loading, error, updateProject, createProject, refetch: fetchProjects }
}
