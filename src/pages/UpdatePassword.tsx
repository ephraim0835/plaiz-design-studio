import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import PasswordInput from '../components/PasswordInput'

const UpdatePassword = () => {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const { updatePassword, session } = useAuth()
    const navigate = useNavigate()

    // Redirect if not authenticated (link expired or invalid)
    // Note: Supabase magic links log the user in automatically, so session should exist.
    useEffect(() => {
        const checkSession = async () => {
            // Give a small grace period for session to initialize
            setTimeout(() => {
                if (!session) {
                    // Don't redirect immediately to allow for potential latency in session hydration
                    // But in a real app you might want to show a specialized "Expired Link" message
                    console.warn("No active session found on Update Password page")
                }
            }, 2000)
        }
        checkSession()
    }, [session])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password.length < 6) {
            setError('Password must be at least 6 characters long')
            setLoading(false)
            return
        }

        try {
            const { error } = await updatePassword(password)
            if (error) {
                setError(error.message)
            } else {
                setSuccess(true)
                // Redirect to dashboard after a delay
                setTimeout(() => {
                    navigate('/dashboard')
                }, 3000)
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background min-h-screen relative overflow-hidden flex flex-col transition-colors duration-700">
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 pt-32 lg:pt-40">
                <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-1000">

                    <div className="glass-panel p-8 lg:p-14 bg-surface border border-border shadow-2xl">
                        <div className="text-center mb-10">
                            <div className="inline-flex p-4 w-[60px] h-[60px] bg-background rounded-[22px] mb-8 border border-border shadow-sm items-center justify-center">
                                <Lock className="w-8 h-8 text-plaiz-blue" />
                            </div>
                            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tighter">Set New Password</h2>
                            <p className="text-muted font-medium text-sm">Create a robust password to secure your account.</p>
                        </div>

                        {success ? (
                            <div className="space-y-6">
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex flex-col items-center text-center gap-3 animate-in zoom-in duration-300">
                                    <CheckCircle size={32} />
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm">Password Updated!</h4>
                                        <p className="text-xs opacity-90">Your password has been changed successfully. Redirecting...</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <PasswordInput
                                    label="New Password"
                                    value={password}
                                    onChange={setPassword}
                                    required
                                />

                                {error && (
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in shake-in-from-left duration-300">
                                        <AlertCircle size={16} className="shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-16 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 text-xs"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            {/* Premium Decorative Lighting */}
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-plaiz-blue/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-40 -left-20 w-64 h-64 bg-plaiz-cyan/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
    )
}

export default UpdatePassword
