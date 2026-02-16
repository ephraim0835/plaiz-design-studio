import React from 'react';
import { Brain, Search, CheckCircle, ShieldCheck, Zap, Loader2, AlertCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    status: 'scanning' | 'evaluating' | 'assigning' | 'success' | 'failure' | 'queued';
    workerName?: string;
    targetRole?: string;
}

const MatchingOverlay: React.FC<Props> = ({ isOpen, status, workerName, targetRole }) => {
    if (!isOpen) return null;

    const roleName = targetRole || 'Specialist';

    const steps = [
        { id: 'scanning', label: `Scanning Elite ${roleName}s`, icon: Search },
        { id: 'evaluating', label: `AI ${roleName} Evaluation`, icon: Brain },
        { id: 'assigning', label: 'Optimal Workload Balancing', icon: Zap },
        { id: 'success', label: `Elite ${roleName} Confirmed`, icon: CheckCircle },
    ];

    // If queued, we stop at assigning but show different UI
    const currentStepIndex = steps.findIndex(s => s.id === (status === 'failure' || status === 'queued' ? 'evaluating' : status));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0c14]/95 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-lg p-12 text-center">
                {/* Animated Rings */}
                <div className="relative mb-12 flex justify-center">
                    <div className="absolute inset-0 animate-ping bg-plaiz-cyan/10 rounded-full blur-2xl" />
                    <div className="relative w-24 h-24 rounded-3xl bg-plaiz-cyan/20 border border-plaiz-cyan/30 flex items-center justify-center">
                        {status === 'success' ? (
                            <CheckCircle className="text-plaiz-cyan animate-bounce" size={48} />
                        ) : status === 'failure' ? (
                            <AlertCircle className="text-plaiz-coral" size={48} />
                        ) : status === 'queued' ? (
                            <Brain className="text-orange-400 animate-pulse" size={48} />
                        ) : (
                            <Loader2 className="text-plaiz-cyan animate-spin" size={48} />
                        )}
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-8 tracking-tight">
                    {status === 'success' ? `${roleName} Match Found` : status === 'failure' ? 'Availability Issue' : status === 'queued' ? 'Joining Priority Queue' : `Analyzing ${roleName} Pool`}
                </h2>

                <div className="space-y-4 mb-10 text-left">
                    {steps.map((step, index) => {
                        const isActive = (status === 'failure' || status === 'queued') ? index < 3 : index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex && status !== 'failure' && status !== 'queued';
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-plaiz-cyan text-white' : 'bg-white/10 text-white/40'}`}>
                                    {isActive && index < currentStepIndex ? <CheckCircle size={16} /> : <Icon size={16} />}
                                </div>
                                <span className={`text-sm font-bold uppercase tracking-widest ${isCurrent ? 'text-plaiz-cyan' : 'text-white/60'}`}>
                                    {step.label}
                                </span>
                                {isCurrent && status !== 'success' && <div className="ml-auto w-1 h-1 bg-plaiz-cyan rounded-full animate-ping" />}
                            </div>
                        );
                    })}
                </div>

                {status === 'success' && (
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-fade-up">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-2">Assigned Specialist</span>
                        <p className="text-xl font-bold text-white">{workerName || 'Elite Designer'}</p>
                        <div className="flex items-center justify-center gap-2 mt-4 text-plaiz-cyan text-xs font-black uppercase tracking-widest">
                            <ShieldCheck size={14} /> Security Guardrails Validated
                        </div>
                    </div>
                )}

                {status === 'queued' && (
                    <div className="p-6 rounded-3xl bg-orange-500/10 border border-orange-500/20 animate-fade-up">
                        <p className="text-orange-400 font-bold italic mb-2">Added to Queue</p>
                        <p className="text-white/80 text-sm">
                            Your request has been saved. A worker will be assigned as soon as one becomes available.
                        </p>
                    </div>
                )}

                {status === 'failure' && (
                    <div className="p-6 rounded-3xl bg-plaiz-coral/10 border border-plaiz-coral/20 animate-shake">
                        <p className="text-plaiz-coral font-bold italic mb-2">Match Not Possible</p>
                        <p className="text-white/60 text-sm">No specialists currently match your specific criteria or are within capacity limits.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-6 py-2 bg-plaiz-coral text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchingOverlay;
