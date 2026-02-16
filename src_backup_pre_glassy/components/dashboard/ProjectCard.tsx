import React from 'react';
import { Project, ProjectStatus } from '../../types';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const statusColors: Record<ProjectStatus, string> = {
        pending: 'bg-background text-muted border-border',
        assigned: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        queued: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        chat_negotiation: 'bg-background text-muted border-border',
        pending_agreement: 'bg-yellow-500/10 text-amber-600 dark:text-yellow-400 border-yellow-500/20',
        pending_down_payment: 'bg-plaiz-coral text-white border-plaiz-coral shadow-[0_0_15px_rgba(255,107,107,0.4)] animate-pulse',
        active: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        ready_for_review: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        approved: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        waiting_for_client: 'bg-yellow-500/10 text-amber-600 dark:text-yellow-400 border-yellow-500/20',
        awaiting_down_payment: 'bg-plaiz-coral text-white border-plaiz-coral shadow-[0_0_15px_rgba(255,107,107,0.4)] animate-pulse',
        work_started: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        review_samples: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        awaiting_payout: 'bg-green-500/10 text-emerald-600 dark:text-emerald-400 border-green-500/20',
        awaiting_final_payment: 'bg-plaiz-cyan/20 text-plaiz-cyan border-plaiz-cyan/30',
        completed: 'bg-green-500/10 text-emerald-600 dark:text-emerald-400 border-green-500/20',
        cancelled: 'bg-red-500/10 text-rose-600 dark:text-rose-400 border-red-500/20',
        flagged: 'bg-plaiz-coral/20 text-plaiz-coral border-plaiz-coral/30',
        review: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Link to={`/projects/${project.id}`} className="group h-full">
            <div className="bg-surface border border-border p-5 lg:p-6 rounded-[24px] shadow-soft hover:shadow-xl hover:border-plaiz-blue/20 transition-all flex flex-col h-full group relative overflow-hidden">
                {project.status === 'pending_down_payment' && (
                    <div className="absolute top-0 right-0 p-3 z-10">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-plaiz-coral opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-plaiz-coral"></span>
                        </span>
                    </div>
                )}

                <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] lg:text-[10px] font-black uppercase tracking-widest border ${statusColors[project.status] || statusColors.pending}`}>
                        {project.status.toLowerCase() === 'queued' ? 'Curating Expert Team' : project.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] lg:text-[10px] text-muted uppercase tracking-widest font-black">
                        {formatDate(project.created_at)}
                    </span>
                </div>

                <h4 className="text-base lg:text-lg font-bold text-foreground mb-2 group-hover:text-plaiz-blue transition-colors line-clamp-1">{project.title}</h4>
                <p className="text-xs lg:text-sm text-muted line-clamp-2 mb-4 lg:mb-6 flex-grow leading-relaxed font-medium">
                    {project.description}
                </p>

                <div className="mb-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted opacity-50 uppercase tracking-widest">Budget Estimation</p>
                        <p className="text-sm font-black text-foreground">
                            {project.assignment_metadata?.budget_ngn
                                ? `₦${project.assignment_metadata.budget_ngn.toLocaleString()}`
                                : (project.assignment_metadata?.budget_range || 'TBD')}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-[10px] lg:text-[11px] font-black text-plaiz-blue/80 uppercase tracking-widest italic group-hover:text-plaiz-blue transition-colors">
                    <span>{project.project_type.replace('_', ' ')}</span>
                    {project.status === 'in_progress' || project.status === 'active' ? (
                        <span className="flex items-center gap-1 text-plaiz-blue">
                            <span className="w-1.5 h-1.5 rounded-full bg-plaiz-cyan animate-pulse" />
                            Work Started
                        </span>
                    ) : project.status === 'pending_down_payment' ? (
                        <span className="text-plaiz-coral font-bold flex items-center gap-1">
                            ACTION REQUIRED
                        </span>
                    ) : project.status === 'assigned' ? (
                        <span className="text-plaiz-blue font-bold flex items-center gap-1">
                            WORKER NOTIFIED
                        </span>
                    ) : null}
                </div>
            </div>
        </Link>
    );
};

export default ProjectCard;
