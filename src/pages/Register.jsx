import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useInviteCodes } from '../hooks/useInviteCodes'
import { WORKER_SPECIALIZATIONS } from '../config/specializations'
import { User, Mail, Lock, Key, ArrowLeft, Info, CheckCircle, Shield, Briefcase, UserCircle, Palette, Code, Printer, Eye, EyeOff, Zap } from 'lucide-react'
import PasswordInput from '../components/PasswordInput'
import Navbar from '../components/Navbar'

const Register = () => {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState('client')
    const [specialization, setSpecialization] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [codeRequested, setCodeRequested] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [cooldown, setCooldown] = useState(0)

    const { signUp, signInWithGoogle } = useAuth()
    const { requestInviteCode, verifyInviteCode } = useInviteCodes()
    const navigate = useNavigate()

    React.useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(c => c - 1), 1000)
            return () => clearInterval(timer)
        }
    }, [cooldown])

    const handlePasswordChange = (pwd) => {
        setPassword(pwd)
    }

    const handleRequestCode = async () => {
        if (!email) return setError('Email is required to request access.')
        if (cooldown > 0) return

        const result = await requestInviteCode(email, role)
        if (result.success) {
            setCodeRequested(true)
            setCooldown(60)
            setSuccess(`Request sent! Ask the Admin for your 6-digit access code.`)
        } else {
            setError(result.error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) return setError('Passwords do not match')
        if (!termsAccepted) return setError('Please accept the terms')
        if (role === 'worker' && !specialization) return setError('Select a specialization')

        setLoading(true)
        try {
            if (role === 'admin' || role === 'worker') {
                if (!inviteCode) throw new Error('Invite code required')
                const verifyResult = await verifyInviteCode(inviteCode, email)
                if (!verifyResult.success) throw new Error('Invalid code')
            }

            const signupData = {
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role === 'worker' ? specialization : role,
                        specialization: role === 'worker' ? specialization : null
                    }
                }
            }

            const { error: signUpError } = await signUp(signupData)
            if (signUpError) throw signUpError
            setSuccess('Account created! Redirecting...')
            setTimeout(() => navigate(`/${role}`), 1500)
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="bg-background min-h-screen relative overflow-hidden flex flex-col transition-colors duration-700">
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 pt-32 lg:pt-40">
                <div className="w-full max-w-[540px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Link to="/" className="inline-flex items-center gap-2 text-muted font-black text-[10px] uppercase tracking-widest mb-8 hover:text-foreground transition-colors">
                        <ArrowLeft size={16} /> Back to home
                    </Link>

                    <div className="glass-panel p-8 lg:p-14 bg-surface border border-border shadow-2xl">
                        <div className="text-center mb-10">
                            <div className="inline-flex p-4 bg-background rounded-[22px] text-plaiz-blue mb-8 border border-border shadow-sm">
                                <User size={28} />
                            </div>
                            <h2 className="text-4xl font-black text-foreground mb-3 tracking-tighter">Join <span className="text-plaiz-blue">Plaiz Studio</span></h2>
                            <p className="text-muted font-medium text-sm">Let's create something great.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Role Select */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">I am a</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['client', 'worker', 'admin'].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`h-14 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all
                                                ${role === r
                                                    ? 'bg-foreground text-background border-foreground shadow-xl'
                                                    : 'bg-surface/40 border-border text-muted hover:bg-surface/60 hover:text-foreground'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {role === 'worker' && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
                                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1">I specialize in</label>
                                    <div className="grid gap-3">
                                        {WORKER_SPECIALIZATIONS.map(spec => (
                                            <button
                                                key={spec.id}
                                                type="button"
                                                onClick={() => setSpecialization(spec.id)}
                                                className={`p-5 rounded-2xl border text-left flex items-center gap-5 transition-all
                                                    ${specialization === spec.id
                                                        ? 'bg-surface border-plaiz-blue shadow-lg ring-4 ring-blue-50/50 dark:ring-blue-900/20'
                                                        : 'bg-surface/40 border-border hover:bg-surface hover:border-plaiz-blue/30'}`}
                                            >
                                                <div className={`p-3 rounded-xl transition-colors ${specialization === spec.id ? 'bg-plaiz-blue text-white' : 'bg-background text-muted shadow-sm'}`}>
                                                    {spec.id === 'graphic_designer' ? <Palette size={18} /> : spec.id === 'web_designer' ? <Code size={18} /> : <Printer size={18} />}
                                                </div>
                                                <span className={`text-[11px] font-bold uppercase tracking-widest ${specialization === spec.id ? 'text-plaiz-blue' : 'text-muted'}`}>{spec.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(role === 'worker' || role === 'admin') && (
                                <div className="p-6 bg-amber-50/10 backdrop-blur-sm rounded-2xl border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                    <div className="flex items-center gap-2 mb-3 font-black text-amber-600 italic"><Info size={14} /> Admin code needed</div>
                                    <div className="flex flex-col gap-2">
                                        {!codeRequested || cooldown > 0 ? (
                                            <button
                                                type="button"
                                                onClick={handleRequestCode}
                                                disabled={cooldown > 0}
                                                className={`text-left font-black transition-all ${cooldown > 0 ? 'text-amber-500/40 cursor-not-allowed' : 'text-amber-500 underline'}`}
                                            >
                                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Request a code'}
                                            </button>
                                        ) : (
                                            <button type="button" onClick={handleRequestCode} className="text-left text-amber-500 underline font-black">Resend code</button>
                                        )}

                                        {codeRequested && (
                                            <div className="mt-4">
                                                <input
                                                    type="text"
                                                    placeholder="6-Digit Code"
                                                    value={inviteCode}
                                                    onChange={(e) => setInviteCode(e.target.value)}
                                                    maxLength={6}
                                                    className="w-full h-12 px-5 bg-surface border border-amber-500/30 rounded-xl text-amber-500 font-black tracking-[0.4em] placeholder:tracking-normal placeholder:font-medium shadow-inner"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1">Full Name</label>
                                    <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full h-16 px-5 bg-background border border-border rounded-2xl text-foreground font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1">Email</label>
                                    <input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-16 px-5 bg-background border border-border rounded-2xl text-foreground font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm shadow-sm" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PasswordInput
                                        label="Password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        showStrength
                                        required
                                    />
                                    <PasswordInput
                                        label="Confirm"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-3 py-2">
                                    <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} required className="w-5 h-5 rounded-lg border-border text-plaiz-blue focus:ring-blue-50 bg-surface grayscale dark:grayscale-0" />
                                    <label htmlFor="terms" className="text-[10px] font-bold text-muted uppercase tracking-widest cursor-pointer hover:text-foreground transition-colors">
                                        I agree to <Link to="/terms" className="text-plaiz-blue hover:underline underline-offset-4">the terms</Link>
                                    </label>
                                </div>
                            </div>

                            {error && <div className="p-5 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in shake-in-from-left duration-300">{error}</div>}
                            {success && <div className="p-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-2">{success}</div>}

                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-16 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-xs"
                                >
                                    {loading ? 'One moment...' : 'Join'}
                                </button>

                                {role === 'client' && (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </form>

                        <div className="mt-12 text-center text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-muted">Have an account? </span>
                            <Link to="/login" className="text-plaiz-blue hover:underline">Sign in</Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Register
