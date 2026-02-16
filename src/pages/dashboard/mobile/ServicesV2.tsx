import React, { useState, useEffect } from 'react';
import { Palette, Code, Printer, Star, ChevronRight, Search, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../../../components/dashboard/TopNav';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

const SERVICES = [
    {
        id: 'graphic',
        title: 'Graphic Design',
        description: 'Logos, branding, and everything your brand needs to look great.',
        icon: Palette,
        price: 'From ₦3k',
        rating: 4.9,
        image: '/graphic_design_service.png',
        tag: 'Top Pick'
    },
    {
        id: 'web',
        title: 'Web Design',
        description: 'High-performance websites built to convert visitors into paying customers.',
        icon: Code,
        price: 'From ₦100k',
        rating: 4.8,
        image: '/web_design_service.png',
        tag: 'Elite Tech'
    },
    {
        id: 'printing',
        title: 'Print Services',
        description: 'We print everything printable — from business cards, flyers, banners, packaging, apparel, signage, and merchandise to fully custom personal and corporate prints in any size or quantity.',
        icon: Printer,
        price: 'From ₦5k',
        rating: 5.0,
        image: '/printing_service.png',
        tag: 'Fast Delivery'
    }
];

const ServicesV2: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-muted/20 border-t-plaiz-blue rounded-full animate-spin mb-8 shadow-xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted">Discovering Services...</p>
            </div>
        );
    }

    return (
        <DashboardLayout title="Discovery">
            <main className="max-w-6xl mx-auto px-6 py-10 lg:py-16 relative z-10">
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={14} className="text-plaiz-blue fill-plaiz-blue" />
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Expert Network</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Discovery</h1>
                    <p className="text-muted text-lg font-medium max-w-xl">Work with verified creatives who deliver fast results at a fair price.</p>
                </div>

                {/* Simple Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-12 items-start transition-all">
                    <div className="w-full lg:flex-1 bg-surface border border-border rounded-xl flex items-center px-4 py-3 gap-3 focus-within:border-plaiz-blue focus-within:ring-2 focus-within:ring-plaiz-blue/5 transition-all">
                        <Search size={18} className="text-muted/40" />
                        <input
                            type="text"
                            placeholder="What are you looking for?"
                            className="bg-transparent border-none p-0 focus:ring-0 text-foreground text-sm font-medium w-full placeholder:text-muted/40"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 w-full lg:w-auto">
                        {['All', 'Graphic', 'Web', 'Print'].map((cat) => (
                            <button
                                key={cat}
                                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap
                                    ${cat === 'All'
                                        ? 'bg-plaiz-blue text-white border-plaiz-blue shadow-md shadow-plaiz-blue/20'
                                        : 'bg-surface text-muted border-border hover:border-muted hover:text-foreground'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Service Stack - Clean Airbnb Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    {SERVICES.map((service, i) => (
                        <div
                            key={service.id}
                            onClick={() => navigate(`/client/request?type=${service.id}`)}
                            className="group bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-soft hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-[var(--surface-bg)] backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]">
                                        {service.tag}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{service.title}</h3>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-plaiz-blue/10 rounded-lg border border-plaiz-blue/20">
                                        <Star size={14} className="text-plaiz-blue fill-plaiz-blue" />
                                        <span className="text-xs font-bold text-plaiz-blue">{service.rating}</span>
                                    </div>
                                </div>
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8 flex-1">
                                    {service.description}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                                    <div>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Service Fee</p>
                                        <p className="text-lg font-bold text-foreground">{service.price}</p>
                                    </div>
                                    <button className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-muted group-hover:bg-plaiz-blue group-hover:text-white group-hover:border-plaiz-blue transition-all active:scale-90">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </DashboardLayout>
    );
};

export default ServicesV2;
