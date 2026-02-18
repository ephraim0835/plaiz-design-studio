import React, { useState } from 'react';
import { Palette, Monitor, Printer, X, ArrowRight, Zap } from 'lucide-react';

interface Service {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (service: Service) => void;
}

// ONLY 3 CORE SERVICES
const SERVICES: Service[] = [
    {
        id: 'graphic_design',
        name: 'Graphic Design',
        description: 'Get professional logos, branding, and social visuals starting from ₦3k.',
        icon: Palette,
        color: 'plaiz-blue'
    },
    {
        id: 'web_design',
        name: 'Web Design',
        description: 'High-performance websites built to convert visitors into paying customers, starting from ₦100k.',
        icon: Monitor,
        color: 'plaiz-blue'
    },
    {
        id: 'printing',
        name: 'Printing Services',
        description: 'We print everything printable — from business cards, flyers, banners, packaging, apparel, signage, and merchandise to fully custom personal and corporate prints in any size or quantity.',
        icon: Printer,
        color: 'plaiz-blue'
    }
];

const ServiceSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
    const [brief, setBrief] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!brief.trim()) return;

        setSubmitting(true);
        // We pass a placeholder ID, the AI Orchestrator in the backend will overwrite it based on the description
        onSelect({
            id: 'graphic_design',
            name: 'New Project',
            description: brief,
            icon: Zap,
            color: 'plaiz-blue'
        });
        setBrief('');
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-2">
                {/* Header */}
                <div className="pt-8 pb-6 px-8 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-plaiz-blue font-bold text-[10px] uppercase tracking-widest">
                            <Zap size={14} className="fill-plaiz-blue" />
                            <span>Verified Experts</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                            Start a <span className="text-plaiz-blue">Project</span>
                        </h2>
                        <p className="text-muted text-sm font-medium mt-2">
                            Select a service and we'll connect you with an expert in minutes.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted hover:text-foreground bg-background hover:bg-surface rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* AI-First Input Area */}
                <div className="p-8 md:p-12">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="relative group">
                            <textarea
                                value={brief}
                                onChange={(e) => setBrief(e.target.value)}
                                placeholder="e.g. I need a modern logo for my tech startup..."
                                className="w-full h-40 bg-background border-2 border-border rounded-3xl p-8 text-lg font-bold text-foreground focus:border-plaiz-blue transition-all outline-none resize-none placeholder:text-muted/30"
                                autoFocus
                            />
                            <div className="absolute bottom-6 right-6 flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${brief.length > 10 ? 'opacity-100' : 'opacity-0'} text-plaiz-blue`}>
                                    AI Ready
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!brief.trim() || submitting}
                            className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 transition-all
                                ${brief.trim()
                                    ? 'bg-plaiz-blue text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95'
                                    : 'bg-muted/10 text-muted/30 border border-border cursor-not-allowed'
                                }
                            `}
                        >
                            {submitting ? (
                                <Zap size={18} className="animate-pulse" />
                            ) : (
                                <Zap size={18} className={brief.trim() ? 'fill-white' : ''} />
                            )}
                            {submitting ? 'Connecting...' : 'Start Matching'}
                        </button>

                        <p className="text-center text-[10px] text-muted/40 font-bold uppercase tracking-[0.2em]">
                            AntiGravity AI will detect your project type and assign the best expert instantly.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ServiceSelectionModal;
