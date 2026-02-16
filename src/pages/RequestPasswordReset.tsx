import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'

const RequestPasswordReset = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const { sendPasswordResetEmail } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await sendPasswordResetEmail(email)
            if (error) {
                // Rate limit (429) is common
                if (error.status === 429) {
                    setError('Too many requests. Please wait a minute before trying again.')
                } else {
                    setError(error.message)
                }
            } else {
                setSuccess(true)
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
                    <Link to="/login" className="inline-flex items-center gap-2 text-muted font-black text-[10px] uppercase tracking-widest mb-8 hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>

                    <div className="glass-panel p-8 lg:p-14 bg-surface border border-border shadow-2xl">
                        <div className="text-center mb-10">
                            <div className="inline-flex p-4 w-[60px] h-[60px] bg-background rounded-[22px] mb-8 border border-border shadow-sm items-center justify-center">
                                <Mail className="w-8 h-8 text-plaiz-blue" />
                            </div>
                            <h2 className="text-3xl font-black text-foreground mb-3 tracking-tighter">Reset Password</h2>
                            <p className="text-muted font-medium text-sm">Enter the email associated with your account and we'll send you a link to reset your password.</p>
                        </div>

                        {success ? (
                            <div className="space-y-6">
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex flex-col items-center text-center gap-3 animate-in zoom-in duration-300">
                                    <CheckCircle size={32} />
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm">Check your email</h4>
                                        <p className="text-xs opacity-90">We've sent a password reset link to <span className="font-bold">{email}</span></p>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-muted">
                                    Didn't receive the email? Check your spam folder or <button onClick={() => setSuccess(false)} className="text-plaiz-blue hover:underline font-bold">try again</button>.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-plaiz-blue transition-colors" size={18} />
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full h-16 pl-14 pr-4 bg-background border border-border rounded-2xl text-foreground font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-muted"
                                        />
                                    </div>
                                </div>

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
                                    {loading ? 'Sending Link...' : 'Send Reset Link'}
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

export default RequestPasswordReset
