import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ChevronLeft, ArrowRight, CheckCircle2, DollarSign, Calendar, Send, Zap, Layout as LayoutIcon, Printer, X, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopNav from '../../../components/dashboard/TopNav';
import { useProjects } from '../../../hooks/useProjects';
import LoadingScreen from '../../../components/LoadingScreen';
import BottomNav from '../../../components/dashboard/BottomNav';

const SERVICE_MAP = {
    graphic: { title: 'Graphic Design', icon: Zap, color: 'text-plaiz-blue', bg: 'bg-plaiz-blue/10', border: 'border-plaiz-blue/20' },
    web: { title: 'Web Design', icon: LayoutIcon, color: 'text-plaiz-cyan', bg: 'bg-plaiz-cyan/10', border: 'border-plaiz-cyan/20' },
    print: { title: 'Printing', icon: Printer, color: 'text-plaiz-coral', bg: 'bg-plaiz-coral/10', border: 'border-plaiz-coral/20' }
};

const BookingWizard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        type: (searchParams.get('type') as keyof typeof SERVICE_MAP) || (searchParams.get('service') as keyof typeof SERVICE_MAP) || 'graphic',
        title: '',
        description: '',
        budget: '',
        timeline: ''
    });
    const { createProject } = useProjects();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const totalSteps = 3;
    const currentService = SERVICE_MAP[formData.type] || SERVICE_MAP.graphic;

    const nextStep = () => {
        if (formData.type === 'graphic' && step === 2) {
            setStep(step + 1); // Skip specialized step for graphic
            return;
        }
        if (step < totalSteps) setStep(step + 1);
        else handleSubmit();
    };

    const prevStep = () => {
        if (formData.type === 'graphic' && step === 3) {
            setStep(step - 1);
            return;
        }
        if (step > 1) setStep(step - 1);
        else navigate(-1);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.budget || !formData.timeline) {
            setError('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const serviceType = formData.type === 'web' ? 'web_design' : formData.type === 'print' ? 'printing' : 'graphic_design';

            const result = await createProject({
                title: formData.title,
                description: formData.description,
                project_type: serviceType,
                client_id: user?.id,
                assignment_metadata: {
                    ...formData,
                    budget_ngn: parseFloat(formData.budget),
                    deadline: formData.timeline
                }
            });

            if (result.success) {
                setStep(4); // Success
            } else {
                setError(result.error || 'Failed to create project');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <LoadingScreen message="Syncing Workspace..." />;

    return (
        <div className="min-h-screen bg-background pb-32 lg:pb-10 lg:pt-20 overflow-x-hidden transition-all duration-700">
            <TopNav />

            <main className="max-w-5xl mx-auto px-6 lg:px-12 py-10 lg:py-24 animate-in fade-in zoom-in-95 duration-1000">
                {/* Wizard Container - Extra airy with large border-radius */}
                <div className="bg-surface rounded-[72px] border border-border shadow-soft overflow-hidden relative transition-all">

                    {/* Branded Detail */}
                    <div className="absolute top-0 right-0 w-80 h-80 blur-[120px] bg-plaiz-blue/10 -z-10" />

                    {/* Header / Progress - 44px+ tap targets for back button */}
                    <div className="p-12 lg:p-16 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="flex items-center gap-8">
                            <button onClick={prevStep} className="w-16 h-16 rounded-full border border-border flex items-center justify-center text-muted/40 hover:text-foreground hover:bg-background transition-all active:scale-90">
                                <ChevronLeft size={32} />
                            </button>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">Tell us more</h1>
                                <p className="text-[10px] font-black text-muted/40 uppercase tracking-[0.4em] mt-1">Step {step} / {totalSteps}</p>
                            </div>
                        </div>

                        {/* High-Fidelity Progress Pills */}
                        <div className="flex gap-4 min-w-[200px]">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className={`h-2.5 flex-1 rounded-full transition-all duration-1000 relative overflow-hidden ${step >= s ? 'bg-plaiz-blue shadow-glow' : 'bg-muted/10'}`}>
                                    {step === s && <div className="absolute inset-0 bg-background/30 animate-pulse" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Content - Airy p-20+ for desktop */}
                    <div className="p-12 lg:p-24 min-h-[500px]">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-16 duration-1000">
                                <h2 className="text-5xl lg:text-7xl font-black mb-16 tracking-tighter text-foreground leading-none">Initialization</h2>
                                <div className="space-y-16">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/20 ml-4">Service</label>
                                        <div className="flex items-center gap-8 p-8 rounded-[40px] bg-background border border-border group transition-all active:scale-[0.98]">
                                            <div className={`w-20 h-20 rounded-[28px] ${currentService.bg} flex items-center justify-center ${currentService.color} border ${currentService.border} group-hover:scale-110 group-hover:shadow-glow transition-all`}>
                                                <currentService.icon size={40} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-2xl font-black text-foreground tracking-tight">{currentService.title}</p>
                                                <p className="text-xs text-muted/30 font-bold uppercase tracking-[0.2em] mt-1">Simple design</p>
                                            </div>
                                            <button onClick={() => navigate('/client/services')} className="text-[10px] font-black text-plaiz-blue px-8 py-4 border border-plaiz-blue/20 rounded-full hover:bg-plaiz-blue/5 transition-all uppercase tracking-[0.3em] active:scale-95">Reassign</button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/20 ml-4">Project Name</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Give it a name..."
                                            className="w-full bg-background border border-border rounded-[40px] p-10 text-2xl lg:text-3xl font-black text-foreground shadow-soft focus:border-plaiz-blue focus:ring-[12px] focus:ring-plaiz-blue/5 transition-all outline-none placeholder:text-muted/10 tracking-tighter"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-16 duration-1000">
                                <h2 className="text-5xl lg:text-7xl font-black mb-16 tracking-tighter text-foreground leading-none">Tell us about it</h2>
                                <textarea
                                    rows={6}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What do you need?"
                                    className="w-full bg-background border border-border rounded-[56px] p-12 lg:p-16 text-xl font-medium text-foreground/70 shadow-soft focus:border-plaiz-blue focus:ring-[12px] focus:ring-plaiz-blue/5 transition-all outline-none resize-none placeholder:text-muted/10 leading-relaxed tracking-tight"
                                />
                                <div className="mt-12 flex items-center gap-6 p-8 bg-plaiz-blue/5 border border-plaiz-blue/10 rounded-[40px] animate-pulse">
                                    <Sparkles size={32} className="text-plaiz-cyan" />
                                    <p className="text-sm font-bold text-plaiz-cyan leading-relaxed tracking-wide uppercase">A short note helps us get it right.</p>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-16 duration-1000">
                                <h2 className="text-5xl lg:text-7xl font-black mb-16 tracking-tighter text-foreground leading-none">Budget & Time</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="p-12 bg-background border border-border rounded-[56px] hover:shadow-xl group cursor-pointer transition-all active:scale-[0.98]">
                                        <div className="w-20 h-20 rounded-[28px] bg-plaiz-blue/10 border border-plaiz-blue/20 flex items-center justify-center text-plaiz-blue mb-10 font-black text-4xl group-hover:scale-110 group-hover:shadow-glow transition-all">
                                            ₦
                                        </div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted/20 mb-4 block ml-2">Budget (Naira)</label>
                                        <input
                                            type="number"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                            placeholder="000,000"
                                            className="bg-transparent border-none p-0 text-5xl lg:text-6xl font-black text-foreground focus:ring-0 w-full tracking-tighter"
                                        />
                                    </div>
                                    <div className="p-12 bg-background border border-border rounded-[56px] hover:shadow-xl group cursor-pointer transition-all active:scale-[0.98]">
                                        <div className="w-20 h-20 rounded-[28px] bg-plaiz-cyan/10 border border-plaiz-cyan/20 flex items-center justify-center text-plaiz-cyan mb-10 group-hover:scale-110 group-hover:shadow-glow transition-all">
                                            <Calendar size={40} />
                                        </div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.5em] text-muted/20 mb-4 block ml-2">Deadline</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formData.timeline}
                                                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                                                className="bg-transparent border-none p-0 text-3xl lg:text-4xl font-black text-foreground focus:ring-0 w-full tracking-tight appearance-none cursor-pointer min-h-[60px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-1000 py-24">
                                <div className="w-40 h-40 rounded-[56px] bg-plaiz-blue border-[6px] border-surface shadow-[0_0_60px_rgba(0,123,255,0.4)] flex items-center justify-center text-white mb-12 group transition-all">
                                    <CheckCircle2 size={80} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <h2 className="text-6xl lg:text-8xl font-black text-foreground mb-8 tracking-tighter leading-none">All set</h2>
                                <p className="text-muted text-2xl font-medium max-w-lg mb-20 leading-tight">Your request is sent. A designer will start soon.</p>
                                <button
                                    onClick={() => navigate('/client/projects')}
                                    className="w-full max-w-sm py-8 bg-foreground text-background rounded-[40px] font-black uppercase tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm mb-6 pb-[calc(2rem + 1px)]"
                                >
                                    View Project
                                </button>
                                <p className="text-[10px] font-black text-muted/10 uppercase tracking-[0.6em] animate-pulse">Working on it</p>
                            </div>
                        )}
                    </div>

                    {/* Standardized Action Controls */}
                    {step < 4 && (
                        <div className="p-12 lg:p-16 bg-background border-t border-border flex items-center justify-between backdrop-blur-3xl relative z-20">
                            <div className="absolute top-0 left-0 right-0">
                                {error && (
                                    <div className="mx-12 mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl animate-in shake-in-from-left duration-300">
                                        {error}
                                    </div>
                                )}
                            </div>
                            <button onClick={prevStep} disabled={submitting} className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/30 hover:text-foreground transition-colors p-6 -ml-6 disabled:opacity-50">
                                Back
                            </button>
                            <button
                                onClick={nextStep}
                                disabled={submitting}
                                className="px-16 py-7 lg:px-20 lg:py-8 bg-plaiz-blue text-white rounded-[32px] font-black uppercase tracking-[0.3em] flex items-center gap-6 shadow-2xl shadow-plaiz-blue/30 active:scale-95 transition-all hover:shadow-glow text-xs lg:text-sm disabled:opacity-50"
                            >
                                {submitting ? 'Sending...' : (step === 3 ? 'Send' : 'Continue')}
                                {submitting ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (step === 3 ? <Send size={28} /> : <ArrowRight size={28} />)}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <BottomNav onMenuClick={() => { }} />
        </div>
    );
};

export default BookingWizard;
