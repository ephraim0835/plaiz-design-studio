import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowRight, Palette, Layout, Printer, Star, Users, ShieldCheck, Clock, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const services = [
        {
            icon: Palette,
            title: 'Graphic Design',
            desc: 'Creative solutions from logos to full branding, managed for quality.',
            price: 'From ₦3k',
            image: '/graphic_design_service.png',
            tag: 'Visuals'
        },
        {
            icon: Layout,
            title: 'Web Design',
            desc: 'High-performance websites and digital experiences built to convert.',
            price: 'From ₦100k',
            image: '/web_design_service.png',
            tag: 'Digital'
        },
        {
            icon: Printer,
            title: 'Print Production',
            desc: 'Premium printing for business cards, banners, apparel, and custom merchandise.',
            price: 'From ₦5k',
            image: '/printing_service.png',
            tag: 'Production'
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 transition-colors duration-700">
                <div className="w-12 h-12 border-4 border-border border-t-plaiz-blue rounded-full animate-spin mb-8 shadow-xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted">Loading...</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen selection:bg-plaiz-blue/10 selection:text-plaiz-blue overflow-x-hidden relative transition-colors duration-700">
            <Navbar />

            {/* Premium Hero Section */}
            <header className="relative pt-40 pb-20 lg:pt-64 lg:pb-32 px-6">
                <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface/60 border border-border rounded-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-sm backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Plaiz Studio</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black text-foreground mb-10 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 italic">
                        Professional Digital Services, <br className="hidden md:block" />
                        <span className="not-italic">Managed </span> <span className="text-plaiz-blue">End-to-End.</span>
                    </h1>

                    <p className="text-xl md:text-3xl text-muted max-w-3xl mb-16 leading-tight font-bold tracking-tight animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        Plaiz Studio provides reliable digital services including graphic design, web design, and printing — with more services expanding soon.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                        <Link to="/register">
                            <button className="px-14 py-6 bg-foreground text-background rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_var(--shadow-color)] hover:scale-[1.05] active:scale-[0.95] transition-all text-xs border border-border">
                                Start a Project
                            </button>
                        </Link>
                        <Link to="/portfolio">
                            <button className="px-14 py-6 bg-surface/60 border border-border text-foreground rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-surface hover:shadow-xl transition-all text-xs backdrop-blur-md">
                                See Results
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Service Grid - Clean & Simple */}
            <section id="services" className="py-32 lg:py-48 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-32 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                        <div className="max-w-2xl">
                            <h2 className="mb-6 text-foreground tracking-tighter font-black text-5xl lg:text-7xl">Active Services.</h2>
                            <p className="text-muted text-xl font-bold tracking-tight">Managed digital solutions. Real results.</p>
                        </div>
                        <div className="flex items-center gap-4 text-muted/40 font-black uppercase text-[10px] tracking-[0.2em]">
                            <span className="w-12 h-0.5 bg-border" /> Quality First
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                        {services.map((service, i) => (
                            <div key={i} className="rounded-4xl p-3 shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-700 overflow-hidden flex flex-col group bg-surface border border-border relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-8 bg-background">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100"
                                    />
                                    <div className="absolute top-6 left-6">
                                        <span className="px-4 py-2 bg-surface/60 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground shadow-xl border border-border">
                                            {service.tag}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-8 pb-10 flex flex-col flex-1 relative z-10">
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-background text-foreground flex items-center justify-center shadow-xl shadow-black/5 border border-border">
                                            <service.icon size={28} />
                                        </div>
                                        <h3 className="text-2xl font-black text-foreground tracking-tighter">{service.title}</h3>
                                    </div>
                                    <p className="text-muted font-bold leading-relaxed mb-10 flex-1 text-sm">{service.desc}</p>
                                    <div className="flex items-center justify-between pt-8 border-t border-border mt-auto">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{service.price}</span>
                                        <Link to="/register" className="flex items-center gap-3 text-foreground font-black text-[11px] uppercase tracking-widest hover:gap-5 hover:text-plaiz-blue transition-all">
                                            Get Started <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                        )}
                    </div>
                </div>
            </section>

            {/* Trust Section - Safe & Professional */}
            <section className="py-24 lg:py-48 px-6 bg-surface/40">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div>
                            <h2 className="mb-10 text-foreground text-5xl lg:text-7xl leading-[0.95] tracking-tighter font-black">Managed digital services <br />that deliver.</h2>
                            <p className="text-xl text-muted mb-16 leading-relaxed font-bold tracking-tight">
                                Plaiz Studio connects clients with skilled professionals to deliver high-quality digital services. We currently focus on graphic design, web design, and printing, while continuously expanding into more service areas.
                            </p>

                            <div className="space-y-12">
                                {[
                                    { icon: ShieldCheck, title: "Secure Payments", desc: "Your money stays protected until you approve the final work. Simple and safe." },
                                    { icon: Clock, title: "Fast Delivery", desc: "Projects move quickly without cutting corners. You get results when you need them." },
                                    { icon: Users, title: "Verified Experts", desc: "Every creative is reviewed before they join. You work with people who know what they're doing." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-8 group">
                                        <div className="flex-shrink-0 w-16 h-16 rounded-[24px] bg-surface border border-border flex items-center justify-center text-foreground shadow-xl group-hover:scale-110 transition-all">
                                            <item.icon size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-foreground mb-2 tracking-tight">{item.title}</h4>
                                            <p className="text-muted text-sm font-bold leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative glass-panel p-3 rotate-1 shadow-2xl group overflow-hidden">
                            <div className="w-full h-full bg-plaiz-blue/20 rounded-2xl flex items-center justify-center">
                                <Users size={64} className="text-plaiz-blue/40" />
                            </div>
                            <div className="absolute inset-x-8 bottom-8 p-8 glass-panel !bg-black/40 !backdrop-blur-xl border-white/20 text-white">
                                <p className="text-lg font-bold italic mb-6 leading-relaxed">"Better presentation builds trust. Trust creates opportunity. Plaiz Studio helped us look more professional."</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20" />
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest uppercase">Alexa Drake</p>
                                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Founder, Core Technologies</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Final CTA */}
            <section className="py-40 lg:py-64 px-6 text-center bg-studio-dark relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-plaiz-blue/20 to-plaiz-cyan/10 pointer-events-none" />
                <div className="relative z-10 max-w-5xl mx-auto">
                    <h2 className="text-white mb-10 text-5xl lg:text-9xl font-black tracking-tighter leading-[0.85]">Ready to start? <br />Let's work together.</h2>
                    <p className="text-white/40 mb-16 text-2xl font-bold tracking-tight max-w-2xl mx-auto leading-relaxed">Plaiz Studio is a managed digital services platform currently specializing in graphic design, web design, and printing solutions.</p>
                    <Link to="/register">
                        <button className="px-16 py-7 bg-studio-light text-studio-dark rounded-[24px] font-black uppercase tracking-[0.3em] shadow-[0_25px_60px_rgba(255,255,255,0.1)] hover:scale-[105] active:scale-[0.95] transition-all text-xs mb-12">
                            Start a Project
                        </button>
                    </Link>
                    <div className="flex items-center justify-center gap-8 text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
                        <span className="flex items-center gap-3"><Zap size={14} className="fill-white/20 border-none" /> Verified Experts</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="flex items-center gap-3"><ShieldCheck size={14} /> Global Escrow</span>
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-plaiz-blue/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-plaiz-cyan/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </section>

            <Footer />
        </div>
    );
};

export default Landing;
