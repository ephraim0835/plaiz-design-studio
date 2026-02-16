import React, { FC, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Palette, Layout, Printer, ChevronRight, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../../../components/dashboard/TopNav';
import BottomNav from '../../../components/dashboard/BottomNav';

const HomeV2: FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const firstName = profile?.full_name?.split(' ')[0] || 'Member';

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const services = [
        {
            id: 'graphic',
            title: 'Graphic Design',
            icon: Palette,
            desc: 'Logos, branding, and everything your brand needs to look great.',
            bg: 'bg-plaiz-blue/10',
            iconColor: 'text-plaiz-blue',
            border: 'border-plaiz-blue/20'
        },
        {
            id: 'web',
            title: 'Web Design',
            icon: Layout,
            desc: 'High-performance websites built to convert visitors into paying customers.',
            bg: 'bg-plaiz-cyan/10',
            iconColor: 'text-plaiz-cyan',
            border: 'border-plaiz-cyan/20'
        },
        {
            id: 'print',
            title: 'Print Services',
            icon: Printer,
            desc: 'We print everything printable — from business cards, flyers, banners, packaging, apparel, signage, and merchandise to fully custom personal and corporate prints in any size or quantity.',
            bg: 'bg-plaiz-coral/10',
            iconColor: 'text-plaiz-coral',
            border: 'border-plaiz-coral/20'
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-muted/20 border-t-plaiz-blue rounded-full animate-spin mb-8 shadow-xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted">Synchronizing Identity...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32 lg:pb-0 lg:pt-20 overflow-x-hidden relative transition-all duration-700">
            <TopNav />

            <main className="max-w-6xl mx-auto px-6 py-10 lg:py-16 relative z-10">
                {/* Friendly Greeting */}
                <div className="mb-14 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tighter">
                        Hi {firstName} <span className="text-plaiz-blue/60 group-hover:animate-bounce inline-block">👋</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted font-medium">
                        What can we build for you? <span className="text-plaiz-blue">Let's create something useful.</span>
                    </p>
                </div>

                {/* Service Quick Links */}
                <section className="mb-20">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Choose a Service</h2>
                        <Link to="/client/services" className="text-plaiz-blue text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all group">
                            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <Link
                                key={service.id}
                                to={`/client/request?type=${service.id}`}
                                className="bg-[var(--card-bg)] border border-[var(--border-color)] p-8 rounded-[32px] shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-start gap-8 group"
                            >
                                <div className={`w-16 h-16 rounded-[22px] ${service.bg} flex items-center justify-center ${service.iconColor} border ${service.border} transition-transform group-hover:scale-110 shadow-sm shadow-black/5`}>
                                    <service.icon size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3 tracking-tight">{service.title}</h3>
                                    <p className="text-[var(--text-muted)] font-medium leading-relaxed">{service.desc}</p>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-plaiz-blue text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                    Start Project <ArrowRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Dashboard Benefit Cards */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[40px] p-10 flex flex-col justify-between aspect-[1.8/1] lg:aspect-auto shadow-2xl">
                        <div>
                            <span className="px-3 py-1 bg-plaiz-blue/10 rounded-lg text-[10px] font-black text-plaiz-blue uppercase tracking-widest border border-plaiz-blue/20 shadow-sm">Your Team</span>
                            <h3 className="text-3xl font-black text-[var(--text-primary)] mt-8 mb-4 tracking-tight leading-tight">Work with verified <br /> creatives who deliver.</h3>
                            <p className="text-[var(--text-muted)] text-base font-medium max-w-sm leading-relaxed">Every expert is reviewed before they join. You get real results from people who know what they're doing.</p>
                        </div>
                        <Link to="/client/projects" className="text-plaiz-blue font-black text-[11px] uppercase tracking-widest flex items-center gap-2 mt-10 hover:gap-3 transition-all">
                            View My Projects <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="bg-[#1A1A1A] border border-white/10 rounded-[40px] p-10 flex flex-col justify-between overflow-hidden relative group aspect-[1.8/1] lg:aspect-auto shadow-2xl">
                        <div className="relative z-10">
                            <span className="px-3 py-1 bg-plaiz-blue text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Studio Perks</span>
                            <h3 className="text-3xl font-black text-white mt-8 mb-4 tracking-tight leading-tight">Print Services at 15% OFF</h3>
                            <p className="text-white/40 text-base font-medium max-w-sm leading-relaxed">Member discount on all custom prints, merch, and materials.</p>
                        </div>
                        <Link to="/client/request?type=print" className="relative z-10 w-fit px-8 py-4 bg-plaiz-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest mt-10 hover:scale-110 shadow-2xl shadow-blue-500/30 transition-all active:scale-95">
                            Get Started
                        </Link>
                        {/* Artistic Gradient Spot */}
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-plaiz-blue/20 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-[5s]" />
                    </div>
                </section>
            </main>

            <BottomNav onMenuClick={() => { }} />
        </div>
    );
};

export default HomeV2;
