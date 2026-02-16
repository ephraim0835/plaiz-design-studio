import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, role, isLoading, profileError } = useAuth()

    // Loading state with improved spinner
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-[#0f172a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-plaiz-cyan/30 border-t-plaiz-cyan rounded-full animate-spin" />
                    <p className="text-white/50 text-sm font-medium animate-pulse">Loading workspace...</p>
                </div>
            </div>
        )
    }

    // Profile error state with recovery option
    if (user && profileError) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-[#0f172a]">
                <div className="text-center p-8 max-w-md bg-white/5 rounded-3xl border border-white/10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-plaiz-coral/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-plaiz-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Connection Issue</h3>
                    <p className="text-white/50 mb-4 text-sm">{profileError}</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-plaiz-blue text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => {
                                // Sign out and redirect to login
                                import('../lib/supabaseClient').then(({ supabase }) => {
                                    supabase.auth.signOut()
                                    window.location.href = '/login'
                                })
                            }}
                            className="px-6 py-2 text-white/50 hover:text-white text-sm transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Role check helper
    const checkRole = () => {
        if (!requiredRole) return true
        if (requiredRole === 'worker') {
            return ['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(role)
        }
        return role === requiredRole
    }

    // Wrong role - redirect to appropriate dashboard
    if (requiredRole && !checkRole()) {
        if (role === 'admin') return <Navigate to="/admin" replace />
        if (['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(role)) {
            return <Navigate to="/worker" replace />
        }
        if (role === 'client') return <Navigate to="/client" replace />
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute

