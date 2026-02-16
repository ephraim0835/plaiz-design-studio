import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, CheckCircle2, ShieldCheck, Clock, ArrowRight, Zap, Layout as LayoutIcon, Printer, Sparkles } from 'lucide-react';
import TopNav from '../../../components/dashboard/TopNav';
import BottomNav from '../../../components/dashboard/BottomNav';

const SERVICE_DETAILS = {
    graphic: {
        title: 'Graphic Design',
        icon: Zap,
        fullDesc: 'Elevate your system identity with premium visual architecture tailored specifically to your objectives. Our network ensures pixel-perfect fidelity at every node, from marks to fully realized branding frameworks.',
        features: ['Bespoke Neural Branding', 'Identity Architecture', 'Social Presence Assets', 'Executive Meta-Decks', 'Unlimited System Revisions'],
        price: '49',
        rating: 4.9,
        time: '3-5 Cycles',
        image: 'https://images.unsplash.com/photo-1626785774573-4b799314346d?q=80&w=2670&auto=format&fit=crop',
        accent: 'plaiz-blue'
    },
    web: {
        title: 'Web Design',
        icon: LayoutIcon,
        fullDesc: 'Acquire digital interfaces that function with absolute efficiency. Our designers construct modern, node-centric experiences built with world-class design principles and optimized for peak latency.',
        features: ['Responsive Meta-UI/UX', 'Node Entry Optimization', 'Interactive Framework Prototypes', 'Performance Integrated SEO', 'Architectural Roadmap'],
        price: '299',
        rating: 4.8,
        time: '7-14 Cycles',
        image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=2574&auto=format&fit=crop',
        accent: 'plaiz-cyan'
    },
    printing: {
        title: 'Printing Services',
        icon: Printer,
        fullDesc: 'High-precision production solutions for the physical domain. We manage the entire lifecycle from optimization to final output, ensuring your physical brand assets maintain spectacular fidelity.',
        features: ['High-Fidelity Preparation', 'Material Synthesis Guide', 'Neural Product Mockups', 'Eco-Integrated Selection', 'Bulk Allocation Credits'],
        price: '19',
        rating: 5.0,
        time: '2-4 Cycles',
        image: 'https://images.unsplash.com/photo-1561070791-23c146e99767?q=80&w=2670&auto=format&fit=crop',
        accent: 'plaiz-coral'
    }
};

const ServiceDetailV2: React.FC = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(true);
    const service = SERVICE_DETAILS[serviceId as keyof typeof SERVICE_DETAILS];

    useEffect(() => {
        const timer = setTimeout(() => setIsProcessing(false), 600);
        return () => clearTimeout(timer);
    }, [serviceId]);

    if (!service) return <div className="min-h-screen bg-background flex items-center justify-center text-muted/20">Domain Not Identified</div>;

    const accentClass = service.accent === 'plaiz-blue' ? 'text-plaiz-blue' : (service.accent === 'plaiz-cyan' ? 'text-plaiz-cyan' : 'text-plaiz-coral');
    const accentBgClass = service.accent === 'plaiz-blue' ? 'bg-plaiz-blue/10 border-plaiz-blue/20' : (service.accent === 'plaiz-cyan' ? 'bg-plaiz-cyan/10 border-plaiz-cyan/20' : 'bg-plaiz-coral/10 border-plaiz-coral/20');

    if (isProcessing) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 border-4 border-muted/5 border-t-plaiz-blue rounded-full animate-spin mb-8 shadow-glow" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted/20">Configuring Domain Node</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-40 lg:pb-10 lg:pt-20 relative overflow-x-hidden transition-all duration-700">
            <TopNav />

            <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-24">
                {/* Refined Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-4 text-muted/40 hover:text-foreground text-[10px] font-black uppercase tracking-[0.4em] mb-16 transition-all group p-4 -ml-4"
                >
                    <div className="w-12 h-12 flex items-center justify-center border border-border rounded-full group-hover:bg-surface group-hover:scale-110 shadow-soft">
                        <ChevronLeft size={24} />
                    </div>
                    Identification Hub
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                    {/* Primary Data Stream (Left) */}
                    <div className="lg:col-span-7 space-y-16 animate-in fade-in slide-in-from-left-12 duration-1000">
                        <section>
                            <div className="flex items-center gap-6 mb-10">
                                <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border ${accentBgClass} ${accentClass} shadow-soft`}>
                                    SYSTEM VERIFIED
                                </div>
                                <div className="flex items-center gap-2.5 px-4 py-2 bg-background/50 backdrop-blur-md rounded-full border border-border">
                                    <Star size={18} className="text-plaiz-cyan fill-plaiz-cyan" />
                                    <span className="text-sm font-black text-foreground">{service.rating}</span>
                                </div>
                            </div>
                            <h1 className="text-6xl lg:text-[7rem] font-black text-foreground mb-10 tracking-tighter leading-[0.85] -ml-1">
                                {service.title}
                            </h1>
                            <p className="text-xl lg:text-3xl text-muted font-medium leading-[1.3] max-w-2xl">
                                {service.fullDesc}
                            </p>
                        </section>

                        <div className="grid grid-cols-2 gap-12 py-16 border-y border-border">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted/20 mb-2">Security Protocol</p>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-14 h-14 rounded-2xl bg-plaiz-blue/10 border border-plaiz-blue/20 flex items-center justify-center text-plaiz-blue shadow-soft group-hover:scale-110 group-hover:shadow-glow">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <span className="text-sm font-black text-foreground uppercase tracking-[0.2em] group-hover:text-plaiz-blue transition-colors">Shield Active</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted/20 mb-2">Delivery Lifecycle</p>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-14 h-14 rounded-2xl bg-plaiz-cyan/10 border border-plaiz-cyan/20 flex items-center justify-center text-plaiz-cyan shadow-soft group-hover:scale-110 group-hover:shadow-glow">
                                        <Clock size={32} />
                                    </div>
                                    <span className="text-sm font-black text-foreground uppercase tracking-[0.2em] group-hover:text-plaiz-cyan transition-colors">{service.time}</span>
                                </div>
                            </div>
                        </div>

                        <section className="space-y-12 transition-all">
                            <div className="flex items-center gap-4">
                                <Sparkles size={24} className="text-plaiz-cyan" />
                                <h3 className="text-3xl font-black text-foreground tracking-tight">Technical Allocation</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {service.features.map((feature, i) => (
                                    <div key={i} className="p-10 rounded-[48px] bg-surface border border-border shadow-soft flex items-center gap-6 hover:shadow-xl group transition-all">
                                        <div className="w-14 h-14 rounded-2xl bg-plaiz-blue/5 border border-plaiz-blue/10 flex items-center justify-center text-plaiz-blue group-hover:scale-110 group-hover:bg-plaiz-blue/10 transition-all">
                                            <CheckCircle2 size={28} />
                                        </div>
                                        <span className="text-base font-black text-foreground/80 group-hover:text-foreground transition-colors tracking-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Action Hub (Right) */}
                    <div className="lg:col-span-5 relative">
                        <div className="lg:sticky lg:top-36 rounded-[72px] overflow-hidden bg-surface border border-border shadow-card group animate-in zoom-in-95 duration-1000">
                            <div className="aspect-square relative overflow-hidden">
                                <img src={service.image} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" alt={service.title} />
                                <div className="absolute inset-0 bg-background/10 group-hover:bg-transparent transition-colors duration-1000" />
                                <div className="absolute top-10 right-10 flex gap-3">
                                    <div className="w-12 h-12 rounded-full bg-surface/40 backdrop-blur-md border border-border flex items-center justify-center text-foreground">
                                        <Sparkles size={20} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-12 lg:p-16 space-y-12 relative overflow-hidden">
                                {/* Branded Ambient Detail */}
                                <div className="absolute -top-10 -right-10 w-48 h-48 blur-[100px] bg-plaiz-blue/20 -z-10" />

                                <div className="flex justify-between items-end relative">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted/20">Domain Credit</p>
                                        <p className="text-6xl lg:text-[5.5rem] font-black text-foreground tracking-tighter leading-none">${service.price}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[9px] font-black text-plaiz-cyan bg-plaiz-cyan/10 border border-plaiz-cyan/20 px-5 py-2.5 rounded-full uppercase tracking-[0.3em] shadow-glow">
                                            ACTIVE
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/client/request?type=${serviceId}`)}
                                    className="w-full py-8 bg-plaiz-blue text-white rounded-[32px] font-black text-xl uppercase tracking-[0.3em] shadow-xl shadow-plaiz-blue/20 hover:scale-[1.03] active:scale-95 transition-all hover:shadow-glow group-hover:shadow-glow"
                                >
                                    Initiate Order
                                </button>
                                <div className="flex flex-col items-center gap-6 opacity-20">
                                    <div className="h-px w-20 bg-muted" />
                                    <p className="text-[9px] text-center font-black text-muted uppercase tracking-[0.6em]">
                                        PROTOCOL • 0014B • ELITE
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Fixed CTA (Standardized 44px+) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-8 bg-surface/80 backdrop-blur-3xl border-t border-border z-[200]">
                <div className="flex items-center justify-between gap-10 max-w-sm mx-auto">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/30">Total</p>
                        <p className="text-4xl font-black text-foreground tracking-tighter">${service.price}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/client/request?type=${serviceId}`)}
                        className="flex-1 min-h-[56px] bg-plaiz-blue text-white rounded-[24px] font-black shadow-xl shadow-plaiz-blue/20 flex items-center justify-center gap-4 active:scale-95 transition-transform uppercase tracking-[0.2em] text-xs"
                    >
                        Initiate <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            <BottomNav onMenuClick={() => { }} />
        </div>
    );
};

export default ServiceDetailV2;
