import React, { FC, ElementType } from 'react';
import { Trophy, TrendingUp, AlertCircle, Star, Activity, Zap } from 'lucide-react';

interface PerformanceScorecardProps {
    stats: {
        active_projects: number;
        average_rating: number;
        idle_since?: string;
        last_assignment_at?: string;
    };
}

const PerformanceScorecard: FC<PerformanceScorecardProps> = ({ stats }) => {
    // Determine status logic
    const isIdle = stats.active_projects === 0;
    const daysIdle = stats.idle_since
        ? Math.floor((new Date().getTime() - new Date(stats.idle_since).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const fairnessBoost = isIdle && daysIdle > 7;
    const isOverloaded = stats.active_projects >= 3;

    return (
        <div className="glass-panel !rounded-[40px] p-8 lg:p-12 relative overflow-hidden bg-[var(--card-bg)] border-[var(--border-color)] shadow-2xl">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[20px] bg-plaiz-blue/5 border border-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Studio Performance</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Live Architecture Metrics</p>
                    </div>
                </div>
                <div className="px-5 py-2 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Sync Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Metric
                    label="Client Satisfaction"
                    value={stats.average_rating ? Number(stats.average_rating).toFixed(1) : '5.0'}
                    sub="Quality Precision"
                    color="blue"
                    icon={Star}
                />
                <Metric
                    label="Resource Load"
                    value={`${stats.active_projects}/3`}
                    sub={isOverloaded ? "Peak Capacity" : "Optimal Flow"}
                    color={isOverloaded ? "coral" : "cyan"}
                    icon={Activity}
                />
                <Metric
                    label="System Priority"
                    value={fairnessBoost ? "Boost" : "Base"}
                    sub={fairnessBoost ? "Queue Advantage" : "Dynamic Sync"}
                    color={fairnessBoost ? "indigo" : "gray"}
                    icon={Zap}
                />
            </div>

            <div className="space-y-4">
                {fairnessBoost && (
                    <div className="p-6 bg-indigo-50/50 backdrop-blur-sm border border-indigo-100 rounded-3xl flex items-start gap-4 animate-in slide-in-from-left duration-700">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-foreground uppercase tracking-widest mb-1">Algorithmic Boost Active</h4>
                            <p className="text-xs text-muted font-medium leading-relaxed">
                                You have been in standby for {daysIdle} days. The platform is prioritizing your node for upcoming premium project distributions.
                            </p>
                        </div>
                    </div>
                )}

                {isOverloaded && (
                    <div className="p-6 bg-plaiz-coral/5 border border-plaiz-coral/20 rounded-3xl flex items-start gap-4 animate-in slide-in-from-left duration-700">
                        <div className="w-10 h-10 rounded-xl bg-plaiz-coral text-white flex items-center justify-center shrink-0 shadow-lg shadow-coral-200">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-foreground uppercase tracking-widest mb-1">Queue Throttling</h4>
                            <p className="text-xs text-muted font-medium leading-relaxed">
                                Maximum capacity reached. New assignments are temporarily paused to maintain Plaiz service standards. Complete active tasks to resume.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Background Accent */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-50/50 rounded-full blur-[80px] pointer-events-none" />
        </div>
    );
};

interface MetricProps {
    label: string;
    value: string;
    sub: string;
    color: 'blue' | 'cyan' | 'coral' | 'indigo' | 'gray';
    icon: ElementType;
}

const Metric: FC<MetricProps> = ({ label, value, sub, color, icon: Icon }) => {
    const accents: Record<string, string> = {
        blue: 'text-plaiz-blue bg-plaiz-blue/5 border-plaiz-blue/10',
        cyan: 'text-plaiz-cyan bg-plaiz-cyan/5 border-plaiz-cyan/10',
        coral: 'text-plaiz-coral bg-plaiz-coral/5 border-plaiz-coral/10',
        indigo: 'text-indigo-500 bg-indigo-50 border-indigo-100',
        gray: 'text-muted bg-background border-border'
    };

    const valueColors: Record<string, string> = {
        blue: 'text-foreground',
        cyan: 'text-foreground',
        coral: 'text-plaiz-coral',
        indigo: 'text-indigo-500',
        gray: 'text-foreground'
    };

    return (
        <div className="p-6 rounded-[32px] bg-background/30 border border-border/50 group hover:bg-surface hover:shadow-xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 ${accents[color]}`}>
                    <Icon size={16} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">{label}</p>
            </div>
            <div className={`text-4xl font-black mb-1 tracking-tighter ${valueColors[color]}`}>
                {value}
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-1 h-1 rounded-full ${color === 'coral' ? 'bg-plaiz-coral' : 'bg-plaiz-blue'}`} />
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{sub}</p>
            </div>
        </div>
    );
};

export default PerformanceScorecard;
