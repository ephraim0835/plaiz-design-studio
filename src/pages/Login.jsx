import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, CheckCircle, Zap, ArrowLeft } from 'lucide-react'
import PasswordInput from '../components/PasswordInput'
import Navbar from '../components/Navbar'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { signIn, signInWithGoogle, role, user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user && role) {
            if (role === 'admin') navigate('/admin')
            else if (['graphic_designer', 'web_designer', 'worker', 'print_specialist'].includes(role)) navigate('/worker')
            else if (role === 'client') navigate('/client')
        }
    }, [user, role, navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { error: signInError } = await signIn({ email, password })
            if (signInError) {
                if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('User not found')) {
                    setError('Account not found or may have been deleted. Contact ofoliephraim@gmail.com for inquiries.')
                } else {
                    setError(signInError.message)
                }
                throw signInError
            }
            setSuccess(true)
        } catch (err) {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background min-h-screen relative overflow-hidden flex flex-col transition-colors duration-700">
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 pt-32 lg:pt-40">
                <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Link to="/" className="inline-flex items-center gap-2 text-muted font-black text-[10px] uppercase tracking-widest mb-8 hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Back to home
                    </Link>

                    <div className="glass-panel p-8 lg:p-14 bg-surface border border-border shadow-2xl">
                        <div className="text-center mb-10">
                            <div className="inline-flex p-4 w-[60px] h-[60px] bg-background rounded-[22px] mb-8 border border-border shadow-sm items-center justify-center">
                                <img src="/plaiz-logo.png" alt="Plaiz Studio Logo" className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">Welcome <span className="text-plaiz-blue">Back</span></h2>
                            <p className="text-muted font-medium text-sm">Sign in to your account.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-8">
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

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Password</label>
                                    <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-plaiz-blue hover:text-blue-400 transition-colors uppercase tracking-wider">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <PasswordInput
                                    value={password}
                                    onChange={setPassword}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="p-5 bg-rose-50 border border-rose-100/50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in shake-in-from-left duration-300">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-5 bg-emerald-50 border border-emerald-100/50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-2 flex items-center gap-2">
                                    <CheckCircle size={16} /> All set. One moment...
                                </div>
                            )}

                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="w-full h-16 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-xs"
                                >
                                    {loading ? 'One moment...' : 'Sign in'}
                                </button>

                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-px bg-border flex-1" />
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">or</span>
                                    <div className="h-px bg-border flex-1" />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => signInWithGoogle()}
                                    className="w-full h-16 bg-surface border border-border text-foreground rounded-2xl font-black uppercase tracking-widest hover:bg-background transition-all flex items-center justify-center gap-3 text-xs"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>
                        </form>

                        <div className="mt-12 text-center text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-muted">New here? </span>
                            <Link to="/register" className="text-plaiz-blue hover:underline">Create account</Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Premium Decorative Lighting */}
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-plaiz-blue/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-40 -left-20 w-64 h-64 bg-plaiz-cyan/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
    )
}

export default Login
