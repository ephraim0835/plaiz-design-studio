import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Profile, UserRole, AuthContextType } from '../types'

// Constants for retry logic
const MAX_PROFILE_RETRIES = 3
const RETRY_DELAY_MS = 1000
const SESSION_REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes before expiry

interface ExtendedAuthContextType extends AuthContextType {
    workerStats: any | null
    refreshProfile: () => Promise<void>
    signInWithGoogle: () => Promise<void>
    profileError: string | null
    isRefreshing: boolean
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null)
    const [session, setSession] = useState<any | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [workerStats, setWorkerStats] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const sessionRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef(true)

    // Retry-enabled profile fetcher
    const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<boolean> => {
        if (!isMountedRef.current) return false

        try {
            setProfileError(null)
            console.log('[AuthContext] Fetching profile for user:', userId, retryCount > 0 ? `(retry ${retryCount})` : '')

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (!isMountedRef.current) return false

            if (profileError) {
                console.error('[AuthContext] Error fetching profile:', {
                    code: profileError.code,
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint,
                    userId: userId
                })

                // PGRST116 means no rows found - user exists in auth but not in profiles table
                if (profileError.code === 'PGRST116') {
                    console.log('[AuthContext] Profile not found. Checking if auto-creation is needed...')

                    // Check if this is an OAuth user (e.g. Google) by looking at user metadata
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user && user.app_metadata.provider === 'google') {
                        console.log('[AuthContext] Google user detected. Auto-creating client profile...')
                        const { data: newProfile, error: createError } = await supabase
                            .from('profiles')
                            .insert([
                                {
                                    id: userId,
                                    full_name: user.user_metadata.full_name || 'Google User',
                                    email: user.email,
                                    role: 'client' // Force client role for Google signups
                                }
                            ])
                            .select()
                            .single()

                        if (createError) {
                            console.error('[AuthContext] Auto-creation failed:', createError)
                            setProfileError('Failed to initialize profile.')
                            return false
                        }

                        console.log('[AuthContext] Profile auto-created successfully')
                        setProfile(newProfile as Profile)
                        setProfileError(null)
                        return true
                    }

                    console.error('[AuthContext] CRITICAL: User authenticated but has no profile record!')
                    setProfileError('Profile not found. Please contact support.')
                    setProfile(null)
                    setWorkerStats(null)
                    return false
                }

                // Retry on transient errors
                if (retryCount < MAX_PROFILE_RETRIES) {
                    console.log(`[AuthContext] Retrying in ${RETRY_DELAY_MS}ms...`)
                    await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
                    return fetchProfile(userId, retryCount + 1)
                }

                setProfileError('Failed to load profile. Please refresh the page.')
                setProfile(null)
                setWorkerStats(null)
                return false
            }

            console.log('[AuthContext] Profile loaded successfully:', {
                userId: profileData.id,
                role: profileData.role,
                name: profileData.full_name
            })
            setProfile(profileData as Profile)
            setProfileError(null)

            // If user is a worker or admin, fetch stats
            if (['graphic_designer', 'web_designer', 'admin', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(profileData.role)) {
                try {
                    const { data: statsData, error: statsError } = await supabase
                        .from('worker_stats')
                        .select('*')
                        .eq('worker_id', userId)
                        .single()

                    if (!statsError && isMountedRef.current) {
                        setWorkerStats(statsData)
                    } else if (statsError?.code !== 'PGRST116') {
                        console.error('Error fetching worker stats:', statsError)
                    }
                } catch (statsErr) {
                    console.error('Error fetching worker stats:', statsErr)
                }
            }

            return true
        } catch (err) {
            console.error('[AuthContext] Unexpected error fetching profile:', err)

            // Retry on network errors
            if (retryCount < MAX_PROFILE_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
                return fetchProfile(userId, retryCount + 1)
            }

            if (isMountedRef.current) {
                setProfileError('Connection error. Please check your network.')
                setProfile(null)
                setWorkerStats(null)
            }
            return false
        }
    }, [])

    // Session refresh timer
    useEffect(() => {
        if (!session?.expires_at) return

        // Clear existing timer
        if (sessionRefreshTimerRef.current) {
            clearTimeout(sessionRefreshTimerRef.current)
        }

        const expiresAt = session.expires_at * 1000 // Convert to milliseconds
        const refreshAt = expiresAt - SESSION_REFRESH_BUFFER_MS
        const timeUntilRefresh = refreshAt - Date.now()

        if (timeUntilRefresh > 0) {
            console.log(`[AuthContext] Session refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`)

            sessionRefreshTimerRef.current = setTimeout(async () => {
                if (!isMountedRef.current) return

                console.log('[AuthContext] Refreshing session...')
                setIsRefreshing(true)

                try {
                    const { data, error } = await supabase.auth.refreshSession()
                    if (error) {
                        console.error('[AuthContext] Session refresh failed:', error)
                    } else if (data.session) {
                        console.log('[AuthContext] Session refreshed successfully')
                        setSession(data.session)
                    }
                } catch (err) {
                    console.error('[AuthContext] Session refresh error:', err)
                } finally {
                    if (isMountedRef.current) {
                        setIsRefreshing(false)
                    }
                }
            }, timeUntilRefresh)
        } else if (timeUntilRefresh > -SESSION_REFRESH_BUFFER_MS) {
            // Session is about to expire or just expired, refresh immediately
            supabase.auth.refreshSession()
        }

        return () => {
            if (sessionRefreshTimerRef.current) {
                clearTimeout(sessionRefreshTimerRef.current)
            }
        }
    }, [session?.expires_at])

    // Initial session check and auth state listener
    useEffect(() => {
        isMountedRef.current = true

        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('[AuthContext] Error getting session:', error)
                }

                if (!isMountedRef.current) return

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id)
                }
            } catch (err) {
                console.error('[AuthContext] Init session error:', err)
            } finally {
                if (isMountedRef.current) {
                    setIsLoading(false)
                }
            }
        }

        initSession()

        // Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[AuthContext] Auth state changed:', event)

            // Use setTimeout(0) to defer Supabase calls and prevent deadlock scenarios
            setTimeout(async () => {
                if (!isMountedRef.current) return

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                    setWorkerStats(null)
                    setProfileError(null)
                }
                setIsLoading(false)
            }, 0)
        })

        return () => {
            isMountedRef.current = false
            subscription.unsubscribe()
            if (sessionRefreshTimerRef.current) {
                clearTimeout(sessionRefreshTimerRef.current)
            }
        }
    }, [fetchProfile])

    const value: ExtendedAuthContextType = {
        user,
        session,
        profile,
        workerStats,
        refreshProfile: useCallback(async () => { if (user?.id) await fetchProfile(user.id) }, [user?.id, fetchProfile]),
        role: profile?.role ?? null,
        specialization: profile?.specialization ?? null,
        isLoading,
        profileError,
        isRefreshing,
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signInWithGoogle: async () => {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
        },
        signUp: (data) => supabase.auth.signUp(data),
        signOut: (options?: any) => supabase.auth.signOut(options),
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
