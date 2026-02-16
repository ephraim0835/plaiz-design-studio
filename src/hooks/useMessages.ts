import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Message } from '../types'

export const useMessages = (projectId: string) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSending, setIsSending] = useState(false)

    // Track sending IDs to prevent double sends
    const sendingIdsRef = useRef<Set<string>>(new Set())
    const subscriptionRef = useRef<any>(null)
    const isMountedRef = useRef(true)

    const fetchMessages = useCallback(async () => {
        if (!projectId) return
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*, profiles(full_name, role, email)')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true })

            if (fetchError) throw fetchError

            if (isMountedRef.current) {
                setMessages(data || [])
            }
        } catch (err: any) {
            console.error('Error fetching messages:', err)
            if (isMountedRef.current) {
                setError(err.message || 'Failed to load messages')
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false)
            }
        }
    }, [projectId])

    // Set up subscription and initial fetch
    useEffect(() => {
        if (!projectId) return

        isMountedRef.current = true

        fetchMessages()

        // Cleanup previous subscription
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe()
        }

        // Subscribe to new messages for this project
        const subscription = supabase
            .channel(`project-messages-${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `project_id=eq.${projectId}`
            }, async (payload) => {
                if (!isMountedRef.current) return

                // Fetch full message with profile data
                const { data: fullMessage } = await supabase
                    .from('messages')
                    .select('*, profiles(full_name, role, email)')
                    .eq('id', payload.new.id)
                    .single()

                if (fullMessage && isMountedRef.current) {
                    setMessages(prev => {
                        // Deduplicate - check if message already exists
                        if (prev.some(m => m.id === fullMessage.id)) return prev
                        // Remove any temp messages with same content from same sender (optimistic)
                        const filtered = prev.filter(m => {
                            if (!m.id.startsWith('temp-')) return true;
                            // Match content and sender to identify the optimistic counterpart
                            const matchesContent = m.content === fullMessage.content;
                            const matchesSender = m.sender_id === fullMessage.sender_id;
                            // Only remove if it likely represents the same message
                            return !(matchesContent && matchesSender);
                        });
                        return [...filtered, fullMessage as Message]
                    })
                }
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'messages',
                filter: `project_id=eq.${projectId}`
            }, (payload) => {
                if (!isMountedRef.current) return
                setMessages(prev => prev.filter(m => m.id !== payload.old.id))
            })
            .subscribe()

        subscriptionRef.current = subscription

        return () => {
            isMountedRef.current = false
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe()
            }
        }
    }, [projectId, fetchMessages])

    const sendMessage = useCallback(async (
        content: string,
        senderId: string,
        attachment: File | null = null,
        isVoiceNote: boolean = false,
        payload: any = null
    ) => {
        if ((!content.trim() && !attachment && !payload) || !projectId || !senderId) {
            return { success: false, error: 'Incomplete message data' }
        }

        // Generate unique send ID to prevent double sends
        const sendId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        if (sendingIdsRef.current.has(sendId)) {
            return { success: false, error: 'Message already being sent' }
        }
        sendingIdsRef.current.add(sendId)
        setIsSending(true)

        // Add optimistic message for immediate feedback
        const tempId = `temp-${Date.now()}`
        const optimisticMessage: Message = {
            id: tempId,
            project_id: projectId,
            sender_id: senderId,
            content: content,
            created_at: new Date().toISOString(),
            is_voice_note: isVoiceNote,
            payload: payload,
            profiles: undefined // Will be filled when real message arrives
        }

        setMessages(prev => [...prev, optimisticMessage])

        try {
            let attachmentUrl: string | null = null
            let attachmentType: string | null = null
            let attachmentName: string | null = null

            if (attachment) {
                const fileExt = attachment.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substr(2, 9)}-${Date.now()}.${fileExt}`
                const filePath = `${projectId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('attachments')
                    .upload(filePath, attachment)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(filePath)

                attachmentUrl = publicUrl
                attachmentName = attachment.name

                if (isVoiceNote) attachmentType = 'audio'
                else if (attachment.type.startsWith('image/')) attachmentType = 'image'
                else if (attachment.type.startsWith('audio/')) attachmentType = 'audio'
                else if (attachment.type.startsWith('video/')) attachmentType = 'video'
                else attachmentType = 'file'
            }

            const { error: sendError } = await supabase
                .from('messages')
                .insert([
                    {
                        content,
                        sender_id: senderId,
                        project_id: projectId,
                        attachment_url: attachmentUrl,
                        attachment_type: attachmentType,
                        attachment_name: attachmentName,
                        is_voice_note: isVoiceNote,
                        payload: payload
                    }
                ])

            if (sendError) throw sendError

            return { success: true }
        } catch (err: any) {
            console.error('Error sending message:', err)

            // Remove optimistic message on failure
            if (isMountedRef.current) {
                setMessages(prev => prev.filter(m => m.id !== tempId))
            }

            return { success: false, error: err.message || 'Failed to send message' }
        } finally {
            sendingIdsRef.current.delete(sendId)
            if (isMountedRef.current) {
                setIsSending(false)
            }
        }
    }, [projectId])

    const deleteMessage = useCallback(async (messageId: string) => {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId)

            if (error) throw error

            // Optimistic update
            if (isMountedRef.current) {
                setMessages(prev => prev.filter(m => m.id !== messageId))
            }

            return { success: true }
        } catch (err: any) {
            console.error('Error deleting message:', err)
            return { success: false, error: err.message || 'Failed to delete message' }
        }
    }, [])

    return {
        messages,
        loading,
        error,
        sendMessage,
        deleteMessage,
        isSending,
        refetch: fetchMessages
    }
}

