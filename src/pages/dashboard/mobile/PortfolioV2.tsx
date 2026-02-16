import React, { useState, useEffect } from 'react';
import { Search, Filter, Image as ImageIcon, ChevronRight, Zap, ExternalLink, ArrowRight } from 'lucide-react';
import TopNav from '../../../components/dashboard/TopNav';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

const PORTFOLIO_ITEMS: any[] = [];

const PortfolioV2: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-muted/20 border-t-plaiz-blue rounded-full animate-spin mb-8 shadow-xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted">Opening Catalog...</p>
            </div>
        );
    }

    return (
        <DashboardLayout title="Studio Work">
            <main className="max-w-7xl mx-auto px-6 py-10 lg:py-16 relative z-10">
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={14} className="text-plaiz-blue fill-plaiz-blue" />
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Our Portfolio</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Studio Work</h1>
                    <p className="text-muted text-lg font-medium max-w-xl">A curated selection of designs delivered by our verified creatives.</p>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-12 items-start transition-all">
                    <div className="w-full lg:flex-1 bg-surface border border-border rounded-xl flex items-center px-4 py-3 gap-3 focus-within:border-plaiz-blue focus-within:ring-2 focus-within:ring-plaiz-blue/5 transition-all">
                        <Search size={18} className="text-muted/40" />
                        <input
                            type="text"
                            placeholder="Search by category..."
                            className="bg-transparent border-none p-0 focus:ring-0 text-foreground text-sm font-medium w-full placeholder:text-muted/40"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 w-full lg:w-auto">
                        {['All Work', 'Graphic', 'Web', 'Print'].map((tab) => (
                            <button
                                key={tab}
                                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap
                                    ${tab === 'All Work'
                                        ? 'bg-plaiz-blue text-white border-plaiz-blue shadow-md shadow-plaiz-blue/20'
                                        : 'bg-surface text-muted border-border hover:border-muted hover:text-foreground'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Clean Masonry-like Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {PORTFOLIO_ITEMS.map((item, i) => (
                        <div
                            key={item.id}
                            className={`bg-surface rounded-2xl overflow-hidden border border-border shadow-soft group hover:shadow-xl transition-all duration-500 cursor-pointer animate-in fade-in slide-in-from-bottom-4
                                ${item.span}`}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="relative overflow-hidden aspect-[4/5] bg-background">
                                <img
                                    src={item.image}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 group-hover:opacity-100"
                                    alt={item.title}
                                />
                                <div className="absolute inset-0 bg-gradient-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                    <button className="w-10 h-10 rounded-full bg-surface text-foreground flex items-center justify-center shadow-lg hover:bg-plaiz-blue hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                                        <ExternalLink size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{item.category}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center pb-16">
                    <button className="px-10 py-4 bg-surface border border-border rounded-xl font-bold uppercase tracking-widest text-xs text-muted hover:bg-background transition-all active:scale-95 group flex items-center gap-4 mx-auto shadow-soft">
                        Show More Projects <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </main>
        </DashboardLayout>
    );
};

export default PortfolioV2;
