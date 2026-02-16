import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    accentColor?: 'blue' | 'cyan' | 'coral' | 'sky';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, accentColor = 'blue' }) => {
    const colors = {
        blue: 'text-blue-400 bg-plaiz-blue/10 border-plaiz-blue/20',
        cyan: 'text-cyan-300 bg-plaiz-cyan/10 border-plaiz-cyan/20',
        coral: 'text-rose-400 bg-plaiz-coral/10 border-plaiz-coral/20',
        sky: 'text-sky-300 bg-plaiz-sky/10 border-plaiz-sky/20',
    };

    return (
        <div className="bg-surface border border-border p-6 rounded-[24px] shadow-soft hover:shadow-xl hover:border-plaiz-blue/20 transition-all group">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-foreground group-hover:scale-105 transition-transform origin-left">{value}</h3>
                </div>
                <div className={`p-4 rounded-2xl border ${colors[accentColor]} flex items-center justify-center shadow-lg shadow-black/5`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
