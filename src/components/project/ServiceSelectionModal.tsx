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
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    if (!isOpen) return null;

    const handleSelect = (service: Service) => {
        setSelectedService(service);
        setTimeout(() => {
            onSelect(service);
            setSelectedService(null);
        }, 200);
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

                {/* Services Grid */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SERVICES.map((service) => {
                            const Icon = service.icon;
                            const isSelected = selectedService?.id === service.id;

                            return (
                                <button
                                    key={service.id}
                                    onClick={() => handleSelect(service)}
                                    className={`
                                        relative p-8 rounded-2xl border text-left 
                                        transition-all duration-300 group overflow-hidden
                                        ${isSelected
                                            ? 'bg-plaiz-blue/5 border-plaiz-blue/20 scale-[0.98]'
                                            : 'bg-background border-border hover:border-plaiz-blue/20 hover:bg-surface active:scale-[0.98]'
                                        }
                                    `}
                                >
                                    <div className="p-4 rounded-xl mb-6 bg-plaiz-blue/10 text-plaiz-blue border border-plaiz-blue/20 inline-block group-hover:scale-110 transition-transform">
                                        <Icon size={24} />
                                    </div>

                                    <h3 className="text-lg font-bold text-foreground mb-2">
                                        {service.name}
                                    </h3>
                                    <p className="text-xs text-muted font-medium leading-relaxed mb-4">
                                        {service.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-[10px] font-bold text-plaiz-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                                        Select <ArrowRight size={14} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 p-6 rounded-2xl bg-background border border-border text-center">
                        <p className="text-xs text-muted font-bold uppercase tracking-widest">
                            ⚡ Fast Results • Fair Pricing • Real Experts
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceSelectionModal;
