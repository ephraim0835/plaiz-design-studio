import React, { useState } from 'react';
import { Tag, ExternalLink, Calendar, User, Sparkles } from 'lucide-react';
import { PortfolioItem } from '../../types';

interface PortfolioGridProps {
    items: PortfolioItem[];
    loading?: boolean;
    showWorker?: boolean;
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({ items, loading, showWorker = false }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-surface border border-border rounded-[32px] overflow-hidden animate-pulse">
                        <div className="h-64 bg-white/5" />
                        <div className="p-8 space-y-4">
                            <div className="h-4 w-1/3 bg-white/5 rounded-full" />
                            <div className="h-6 w-2/3 bg-white/5 rounded-full" />
                            <div className="h-20 w-full bg-white/5 rounded-2xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-20 px-6">
                <div className="inline-flex p-6 bg-white/5 rounded-full mb-6 text-muted">
                    <Sparkles size={40} />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3">No work featured yet</h3>
                <p className="text-muted text-lg max-w-md mx-auto">
                    Projects will appear here once they are completed and added to the portfolio.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
                <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group bg-surface border border-border rounded-[32px] overflow-hidden hover:border-plaiz-blue/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-plaiz-blue/10 flex flex-col"
                >
                    {/* Image Container */}
                    <div className="h-64 relative overflow-hidden bg-black/20">
                        <img
                            src={item.image_url}
                            alt={item.description || 'Project image'}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 ${hoveredId === item.id ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="absolute bottom-6 left-6 right-6">
                                <button className="w-full py-3 bg-white text-plaiz-blue rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-plaiz-blue hover:text-white transition-all shadow-xl">
                                    View Full Project <ExternalLink size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Category Badge */}
                        <div className="absolute top-6 left-6 px-4 py-2 bg-plaiz-blue text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md shadow-lg">
                            <Tag size={12} />
                            {item.service_type.replace('_', ' ')}
                        </div>

                        {/* Featured Badge */}
                        {item.is_featured && (
                            <div className="absolute top-6 right-6 p-2 bg-amber-400 text-black rounded-full shadow-lg">
                                <Sparkles size={14} />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                                <Calendar size={12} />
                                {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                            {showWorker && item.profiles && (
                                <>
                                    <span className="text-muted/30">•</span>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-plaiz-cyan uppercase tracking-widest">
                                        <User size={12} />
                                        {item.profiles.full_name}
                                    </div>
                                </>
                            )}
                        </div>

                        <p className="text-foreground/80 text-sm leading-relaxed font-medium mb-6 line-clamp-3 italic">
                            "{item.ai_polished_description || item.description}"
                        </p>

                        <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Plaiz Verified</span>
                            <div className="flex -space-x-2">
                                {/* Small indicators could go here */}
                                <div className="w-6 h-6 rounded-full border-2 border-surface bg-plaiz-blue/20 flex items-center justify-center">
                                    <CheckCircle size={10} className="text-plaiz-blue" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const CheckCircle = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export default PortfolioGrid;
