import React from 'react';
import { Clock, CheckCircle2, FlaskConical, PlayCircle, Loader2 } from 'lucide-react';

interface ProjectStatusTrackerProps {
    status: string;
}

const ProjectStatusTracker: React.FC<ProjectStatusTrackerProps> = ({ status }) => {
    const phases = [
        { key: 'assigned', label: 'Quote', icon: PlayCircle },
        { key: 'waiting_payment', label: 'Payment', icon: Loader2 },
        { key: 'in_progress', label: 'In Progress', icon: Clock },
        { key: 'under_review', label: 'Review', icon: FlaskConical },
        { key: 'completed', label: 'Completed', icon: CheckCircle2 },
    ];

    const getCurrentStep = () => {
        if (status === 'pending_agreement') return 0;
        if (status === 'waiting_payment') return 1;
        if (status === 'in_progress') return 2;
        if (status === 'under_review') return 3;
        if (status === 'completed') return 4;
        return 0; // default for assigned
    };

    const currentStep = getCurrentStep();

    return (
        <div className="w-full bg-background/30 backdrop-blur-xl border-b border-white/5 px-6 py-2 flex items-center justify-between overflow-x-auto scrollbar-hide gap-8">
            {phases.map((phase, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const Icon = phase.icon;

                return (
                    <div key={phase.key} className="flex items-center gap-3 shrink-0">
                        <div className={`
                            w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500
                            ${isActive ? 'bg-primary text-primary-foreground shadow-glow scale-110' :
                                isCompleted ? 'bg-primary/20 text-primary' :
                                    'bg-accent/10 text-muted/40'}
                        `}>
                            {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} className={isActive ? 'animate-pulse' : ''} />}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isActive ? 'text-foreground' : 'text-muted/40'}`}>
                                Phase {index + 1}
                            </span>
                            <span className={`text-[11px] font-bold ${isActive ? 'text-primary' : isCompleted ? 'text-foreground/60' : 'text-muted/20'}`}>
                                {phase.label}
                            </span>
                        </div>
                        {index < phases.length - 1 && (
                            <div className="ml-4 w-8 h-[1px] bg-border hidden sm:block" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectStatusTracker;
