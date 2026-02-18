import React, { useState } from 'react';
import { Tag, ExternalLink, Calendar, User, Sparkles, X, Globe, ArrowRight } from 'lucide-react';
import { PortfolioItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface PortfolioGridProps {
    items: PortfolioItem[];
    loading?: boolean;
    showWorker?: boolean;
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({ items, loading, showWorker = false }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

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
                                <button
                                    onClick={() => setSelectedItem(item)}
                                    className="w-full py-3 bg-white text-plaiz-blue rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-plaiz-blue hover:text-white transition-all shadow-xl"
                                >
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

                        {item.title && (
                            <h4 className="text-xl font-black text-white mb-2 leading-tight">{item.title}</h4>
                        )}

                        <p className="text-foreground/60 text-sm leading-relaxed font-medium mb-6 line-clamp-3 italic">
                            "{item.ai_polished_description || item.description}"
                        </p>

                        <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Plaiz Studio Verified</span>
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

            <FullViewModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
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

interface ModalProps {
    item: PortfolioItem | null;
    onClose: () => void;
}

const FullViewModal: React.FC<ModalProps> = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-6xl bg-surface border border-white/10 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh] lg:max-h-[85vh] relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Reliable Close Button inside the container */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110] backdrop-blur-md border border-white/10"
                        title="Close Modal"
                    >
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>

                    {/* Image Section */}
                    <div className="w-full lg:w-2/3 bg-black/40 flex items-center justify-center p-6 md:p-10 lg:p-16 min-h-[300px] lg:min-h-[500px]">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                src={item.image_url}
                                alt={item.title}
                                className="max-w-full max-h-[50vh] lg:max-h-full w-auto h-auto object-contain rounded-lg md:rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 hover:scale-[1.02] transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-full lg:w-1/3 p-6 md:p-8 lg:p-12 flex flex-col overflow-y-auto custom-scrollbar bg-surface/50 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-white/5">
                        <div className="flex flex-wrap items-center gap-2 mb-6 lg:mb-8">
                            <span className="px-3 md:px-4 py-1.5 bg-plaiz-blue/10 text-plaiz-blue rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-plaiz-blue/20">
                                {item.service_type.replace('_', ' ')}
                            </span>
                            {item.is_featured && (
                                <span className="px-3 md:px-4 py-1.5 bg-amber-400/10 text-amber-400 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-amber-400/20">
                                    ★ Featured
                                </span>
                            )}
                        </div>

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 lg:mb-6 leading-tight tracking-tight">
                            {item.title}
                        </h2>

                        <p className="text-foreground/70 text-base md:text-lg leading-relaxed mb-8 lg:mb-10 font-medium">
                            {item.ai_polished_description || item.description}
                        </p>

                        <div className="space-y-4 md:space-y-6 pt-6 lg:pt-10 border-t border-border/50 mt-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Created By</p>
                                    <p className="text-sm md:text-base text-white font-bold">{item.profiles?.full_name || 'Anonymous Creator'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Date</p>
                                    <p className="text-sm md:text-base text-white font-bold">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            {item.website_link && (
                                <a
                                    href={item.website_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 lg:py-5 bg-plaiz-blue text-white rounded-xl lg:rounded-2xl font-black text-base lg:text-lg shadow-xl shadow-plaiz-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    Visit Live Website <Globe size={18} className="lg:w-5 lg:h-5" />
                                </a>
                            )}

                            <a
                                href={item.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-4 lg:py-5 bg-white/5 border border-white/10 text-white rounded-xl lg:rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-sm lg:text-base"
                            >
                                <ExternalLink size={16} className="lg:w-[18px] lg:h-[18px]" /> View Original Image
                            </a>

                            <button
                                onClick={onClose}
                                className="w-full py-4 lg:py-5 bg-white/5 border border-white/10 text-white rounded-xl lg:rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                            >
                                Back to Gallery
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PortfolioGrid;
