import React from 'react';
import { ShieldCheck, Zap, Clock, Star, AlertTriangle, Users } from 'lucide-react';

interface AssignmentDetailsProps {
    metadata: any; // JSONB from DB
    workers: any[];
    onReassign: (workerId: string) => void;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ metadata, workers, onReassign }) => {
    // If no metadata, show placeholder
    if (!metadata || !metadata.match_score) {
        return (
            <div className="p-6 rounded-2xl bg-background border border-border text-center">
                <p className="text-muted text-sm">No AI reasoning data available for this assignment.</p>
            </div>
        );
    }

    const { total, breakdown } = metadata.match_score;
    const isHighMatch = total >= 80;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Zap className="text-plaiz-cyan" size={20} />
                AI Match Reasoning
            </h3>

            {/* Total Score Card */}
            <div className={`p-6 rounded-2xl border ${isHighMatch ? 'bg-plaiz-cyan/10 border-plaiz-cyan/30' : 'bg-plaiz-coral/10 border-plaiz-coral/30'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Match Confidence</span>
                    <span className={`text-2xl font-black ${isHighMatch ? 'text-plaiz-cyan' : 'text-plaiz-coral'}`}>{total}/100</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${isHighMatch ? 'bg-plaiz-cyan' : 'bg-plaiz-coral'} transition-all duration-1000`}
                        style={{ width: `${total}%` }}
                    />
                </div>
                <p className="mt-4 text-xs text-muted font-medium leading-relaxed">
                    {isHighMatch
                        ? "Excellent fit. This expert matches all skill requirements and is currently available."
                        : "Moderate fit. The expert has the skills but may have a high active workload."}
                </p>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 gap-4">
                <ScoreCard title="Skills" score={breakdown?.skill} icon={ShieldCheck} color="blue" />
                <ScoreCard title="Availability" score={breakdown?.availability} icon={Clock} color="green" />
                <ScoreCard title="Fairness Boost" score={breakdown?.fairness} icon={Users} color="purple" />
                <ScoreCard title="Performance" score={breakdown?.rating} icon={Star} color="yellow" />
            </div>

            {/* Reassignment Tool */}
            <div className="pt-6 border-t border-border">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Override Assignment</h4>
                <div className="space-y-3">
                    {workers.map(worker => (
                        <button
                            key={worker.id}
                            onClick={() => onReassign(worker.id)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-background hover:bg-surface border border-border transition-all group hover:border-plaiz-blue/20 shadow-sm"
                        >
                            <span className="text-sm font-bold text-foreground">{worker.full_name || 'Unknown'}</span>
                            <span className="text-[10px] text-muted group-hover:text-plaiz-cyan uppercase font-bold tracking-wider">Assign</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ScoreCard = ({ title, score, icon: Icon, color }: any) => {
    const colors = {
        blue: 'text-blue-400 bg-blue-400/10',
        green: 'text-emerald-400 bg-emerald-400/10',
        purple: 'text-purple-400 bg-purple-400/10',
        yellow: 'text-amber-400 bg-amber-400/10'
    };

    return (
        <div className="p-4 rounded-xl bg-background border border-border flex flex-col items-center text-center shadow-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${colors[color as keyof typeof colors]}`}>
                <Icon size={14} />
            </div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{title}</span>
            <span className="text-lg font-black text-foreground">{score || 0}</span>
        </div>
    );
}

export default AssignmentDetails;
