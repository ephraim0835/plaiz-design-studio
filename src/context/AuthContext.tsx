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
    sendPasswordResetEmail: (email: string) => Promise<{ data: any; error: any }>
    updatePassword: (password: string) => Promise<{ data: any; error: any }>
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
            let profileData = null
            let localSession = null

            // 1. EMERGENCY: Read Session Manually from LocalStorage
            try {
                const raw = localStorage.getItem('plaiz-auth-token')
                if (raw) {
                    localSession = JSON.parse(raw)
                }
            } catch (e) {
                console.error('LocalStorage read failed:', e)
            }

            const token = localSession?.access_token
            const cachedUser = localSession?.user

            // 2. Try RPC via Fetch (Bypass Supabase Client)
            if (token) {
                try {
                    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_own_profile`

                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 6000)

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({}),
                        signal: controller.signal
                    })
                    clearTimeout(timeoutId)

                    if (response.ok) {
                        profileData = await response.json()
                    }
                } catch (rpcErr: any) {
                    console.error('RPC Fetch Failed:', rpcErr)
                }
            }

            // 3. Fail-Open: If RPC failed or no token, use cached user from storage
            if (!profileData && cachedUser) {
                console.warn('[AuthContext] Using EMERGENCY FALLBACK from cached session')
                // Try to infer role from user metadata
                const inferredRole = cachedUser.user_metadata?.role || 'client'

                profileData = {
                    id: userId,
                    email: cachedUser.email,
                    full_name: cachedUser.user_metadata?.full_name || 'User',
                    avatar_url: cachedUser.user_metadata?.avatar_url,
                    role: inferredRole,
                    is_mock: true
                }
                setProfileError(null)
            }

            if (profileData) {
                setProfile(profileData as Profile)
                setWorkerStats(null)
                setProfileError(null)
                return true
            }

            return false

            if (!isMountedRef.current) return false

            if (profileError) {
                console.error('[AuthContext] Error fetching profile:', {
                    error: profileError,
                    userId: userId
                })

                // PGRST116 means no rows found - user exists in auth but not in profiles table
                if (typeof profileError === 'object' && (profileError as any)?.code === 'PGRST116') {
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

                const errorMsg = typeof profileError === 'string' ? profileError : (profileError as any)?.message || (profileError as any)?.details || JSON.stringify(profileError) || 'Unknown error';
                console.error('[AuthContext] Auth error details:', errorMsg);

                setProfileError(`Profile load failed: ${errorMsg}`)
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
        } catch (err: any) {
            console.error('[AuthContext] Unexpected error fetching profile:', err)

            // Retry on network errors
            if (retryCount < MAX_PROFILE_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
                return fetchProfile(userId, retryCount + 1)
            }

            if (isMountedRef.current) {
                setProfileError(`Connection error: ${err.message}`)
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

        let isInitialCheck = true;

        // Safety timeout: Force loading to complete after 10 seconds
        const loadingTimeout = setTimeout(() => {
            if (isMountedRef.current && isInitialCheck) {
                console.warn('[AuthContext] Loading timeout reached - forcing completion')
                isInitialCheck = false
                setIsLoading(false)

                // If we have a session but no profile yet, try one more time
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user && !profile) {
                        console.log('[AuthContext] Timeout recovery: retrying profile fetch')
                        fetchProfile(session.user.id)
                    }
                })
            }
        }, 10000) // 10 second timeout

        // Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Auth state changed:', event)

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

            if (isInitialCheck) {
                isInitialCheck = false;
                setIsLoading(false)
                clearTimeout(loadingTimeout) // Clear timeout since we completed normally
            }
        })

        return () => {
            isMountedRef.current = false
            clearTimeout(loadingTimeout)
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
        sendPasswordResetEmail: async (email) => {
            return await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            })
        },
        updatePassword: async (password) => {
            return await supabase.auth.updateUser({ password })
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
