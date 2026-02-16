import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import ProjectCard from '../../components/dashboard/ProjectCard';
import ProjectChat from '../../components/chat/ProjectChat';
import DeliverableUpload from '../../components/project/DeliverableUpload';
import PerformanceScorecard from '../../components/dashboard/PerformanceScorecard';
import CompletionModal from '../../components/project/CompletionModal';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import LoadingScreen from '../../components/LoadingScreen';
import {
    Briefcase,
    MessageSquare,
    CheckCircle,
    Clock,
    DollarSign,
    Zap,
    Info,
    ChevronRight,
    Calendar,
    Target,
    Upload,
    X,
    Activity
} from 'lucide-react';
import { ProjectStatus } from '../../types';

const STATUS_GROUPS: Record<string, ProjectStatus[]> = {
    pending: ['pending', 'queued', 'assigned', 'chat_negotiation', 'pending_agreement'],
    in_progress: ['active', 'in_progress', 'work_started', 'waiting_for_client', 'pending_down_payment', 'awaiting_down_payment'],
    review: ['review_samples', 'ready_for_review', 'review'],
    completed: ['completed', 'approved', 'awaiting_payout', 'awaiting_final_payment'],
    flagged: ['flagged', 'cancelled']
};

const WorkerDashboard: React.FC = () => {
    const { profile, specialization, workerStats, refreshProfile } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [completionModalOpen, setCompletionModalOpen] = useState(false);
    const [showBrief, setShowBrief] = useState(false);
    const [projectToUpload, setProjectToUpload] = useState<any>(null);
    const [toggling, setToggling] = useState(false);

    const { projects: assignedProjects, loading: assignedLoading, updateProject } = useProjects({
        worker_id: profile?.id,
        status: undefined // Get all assigned projects
    });

    const getStatusCount = (statusGroup: string) => {
        if (statusGroup === 'all') return assignedProjects.length;
        const group = STATUS_GROUPS[statusGroup] || [];
        return assignedProjects.filter(p => group.includes(p.status)).length;
    };

    const filteredAssignments = assignedProjects.filter(p => {
        if (statusFilter === 'all') return true;
        return STATUS_GROUPS[statusFilter]?.includes(p.status);
    });

    const activeProjectCount = getStatusCount('in_progress') + getStatusCount('pending');
    const completedProjectsCount = getStatusCount('completed');
    const pendingReviewCount = getStatusCount('review');

    const openUploadModal = (project: any) => {
        setProjectToUpload(project);
        setUploadModalOpen(true);
    };

    if (assignedLoading) return <LoadingScreen message="Syncing Grid Assignments..." />;

    return (
        <DashboardLayout title="Designer Studio" hideBottomNav={!!selectedProjectId}>
            <div className="space-y-12 pb-20">
                {/* Friendly Greeting */}
                <div className="mb-0">
                    <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tighter">
                        Hi {profile?.full_name?.split(' ')[0] || 'Expert'} <span className="text-plaiz-blue/60 inline-block">👋</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted font-medium">
                        What are we creating today? <span className="text-plaiz-blue">Let's build excellence.</span>
                    </p>
                </div>

                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Active Projects"
                        value={activeProjectCount}
                        icon={Activity}
                        accentColor="blue"
                    />
                    <StatsCard
                        title="Completed"
                        value={completedProjectsCount}
                        icon={CheckCircle}
                        accentColor="cyan"
                    />
                    <StatsCard
                        title="Pending Review"
                        value={pendingReviewCount}
                        icon={Clock}
                        accentColor="sky"
                    />
                    <StatsCard
                        title="My Level"
                        value={workerStats?.level || 1}
                        icon={Zap}
                        accentColor="coral"
                    />
                </div>

                {/* Main Workflow Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start min-h-[700px] relative">

                    {/* Project Selector (List) - Col 4 */}
                    <div className={`lg:col-span-4 lg:sticky lg:top-24 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hide ${selectedProjectId ? 'hidden lg:block' : 'block'}`}>
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Current Assignments</h2>
                            <span className="text-[10px] font-black text-plaiz-blue bg-plaiz-blue/10 px-3 py-1 rounded-full">{filteredAssignments.length}</span>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                            {(['all', 'pending', 'in_progress', 'review', 'completed', 'flagged'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0
                                    ${statusFilter === status
                                            ? 'bg-plaiz-blue/20 border-plaiz-blue/30 text-plaiz-blue'
                                            : 'bg-surface border-border text-muted hover:border-border hover:text-foreground'}`}
                                >
                                    {status.replace('_', ' ')}
                                    <span className="ml-1.5 opacity-40">({getStatusCount(status)})</span>
                                </button>
                            ))}
                        </div>

                        {assignedProjects.length === 0 ? (
                            <div className="p-12 text-center rounded-[40px] border-2 border-dashed border-border bg-surface/50">
                                <Briefcase className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-muted/40 uppercase tracking-widest">No projects assigned</p>
                            </div>
                        ) : filteredAssignments.length === 0 ? (
                            <div className="p-12 text-center rounded-[40px] border-2 border-dashed border-border bg-surface/50">
                                <Briefcase className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-muted/40 uppercase tracking-widest">No matching assignments</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAssignments.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProjectId(p.id)}
                                        className={`w-full group rounded-[32px] p-6 text-left transition-all border outline-none
                                            ${selectedProjectId === p.id
                                                ? 'bg-plaiz-blue border-plaiz-blue shadow-glow'
                                                : 'bg-surface border-border hover:border-plaiz-blue/30 shadow-soft'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                                ${selectedProjectId === p.id ? 'bg-white/20 border-white/20 text-white' : 'bg-background border-border text-muted'}`}>
                                                {p.status.toLowerCase() === 'queued' ? 'Curating Expert Team' : p.status.replace(/_/g, ' ')}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${selectedProjectId === p.id ? 'text-white/40' : 'text-muted/40'}`}>
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className={`text-lg font-black tracking-tight mb-4 ${selectedProjectId === p.id ? 'text-white' : 'text-foreground'}`}>
                                            {p.title}
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${selectedProjectId === p.id ? 'text-white/60' : 'text-muted'}`}>
                                                ₦{p.assignment_metadata?.budget_ngn?.toLocaleString() || 'TBD'}
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${selectedProjectId === p.id ? 'text-white/60' : 'text-muted'}`}>
                                                {p.assignment_metadata?.deadline ? new Date(p.assignment_metadata.deadline).toLocaleDateString() : 'TBD'}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat & Brief Interface (Detail) - Col 8 */}
                    <div className={`flex flex-col h-[calc(100vh-100px)] lg:h-[700px] relative bg-background overflow-hidden transition-all ${selectedProjectId
                        ? 'fixed inset-0 z-50 lg:static lg:z-auto lg:bg-transparent'
                        : 'hidden lg:flex lg:col-span-8 lg:bg-transparent'
                        }`}>
                        {selectedProjectId ? (
                            <div className="h-full flex gap-4 transition-all duration-700">

                                {/* Info Panel (Self-contained within the chat area) */}
                                <div className={`transition-all duration-500 overflow-hidden relative z-[60]
                                    ${showBrief ? 'w-full lg:w-80 opacity-100 fixed inset-0 lg:static lg:inset-auto bg-background lg:bg-transparent' : 'w-0 opacity-0'}`}>
                                    <div className="w-full lg:w-80 h-full bg-surface border border-border lg:rounded-[40px] p-8 shadow-soft overflow-y-auto scrollbar-hide pt-24 lg:pt-8">
                                        <div className="flex items-center justify-between mb-10">
                                            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Project Brief</h3>
                                            <button onClick={() => setShowBrief(false)} className="p-2 text-muted hover:text-foreground">
                                                <X size={16} />
                                            </button>
                                        </div>

                                        {(() => {
                                            const p = assignedProjects.find(px => px.id === selectedProjectId);
                                            if (!p) return null;
                                            return (
                                                <div className="space-y-10">
                                                    <div className="space-y-3 font-medium">
                                                        <label className="text-[9px] font-black text-muted/30 uppercase tracking-[0.2em]">Requirement Details</label>
                                                        <p className="text-sm text-foreground/70 leading-relaxed italic">{p.description || 'No description provided.'}</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="p-5 bg-background border border-border rounded-2xl">
                                                            <label className="text-[8px] font-black text-muted/30 uppercase tracking-widest block mb-1">Target Budget</label>
                                                            <p className="text-sm font-black text-plaiz-blue">₦{p.assignment_metadata?.budget_ngn?.toLocaleString() || 'TBD'}</p>
                                                        </div>
                                                        <div className="p-5 bg-background border border-border rounded-2xl">
                                                            <label className="text-[8px] font-black text-muted/30 uppercase tracking-widest block mb-1">Target Deadline</label>
                                                            <p className="text-sm font-black text-plaiz-cyan">{p.assignment_metadata?.deadline || 'TBD'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-5 bg-plaiz-blue/5 border border-plaiz-blue/10 rounded-2xl flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                                                            <Zap size={18} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-muted/30 uppercase tracking-widest">Workflow</label>
                                                            <p className="text-[10px] font-black text-foreground uppercase tracking-wider">{p.project_type.replace('_', ' ')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="flex-1 relative lg:rounded-[40px] overflow-hidden border-0 lg:border border-border shadow-none lg:shadow-soft bg-surface flex flex-col">
                                    {/* Mobile Header */}
                                    <div className="lg:hidden p-4 border-b border-border bg-surface flex items-center justify-between shrink-0 z-20">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedProjectId(null)}
                                                className="p-2 -ml-2 text-muted hover:text-foreground"
                                            >
                                                <ChevronRight className="rotate-180" size={24} />
                                            </button>
                                            <span className="font-bold text-foreground truncate max-w-[200px]">{assignedProjects.find(p => p.id === selectedProjectId)?.title}</span>
                                        </div>
                                    </div>

                                    <ProjectChat
                                        projectId={selectedProjectId}
                                        projectTitle={assignedProjects.find(p => p.id === selectedProjectId)?.title || 'Project Chat'}
                                    />

                                    {/* Project Brief Trigger */}
                                    <button
                                        onClick={() => setShowBrief(!showBrief)}
                                        className={`absolute top-20 lg:top-20 top-[4.5rem] left-4 lg:left-6 z-40 p-3 lg:p-4 rounded-2xl transition-all shadow-xl backdrop-blur-md border
                                            ${showBrief ? 'bg-plaiz-blue text-white border-plaiz-blue' : 'bg-surface/80 text-muted hover:text-foreground border-border'}`}
                                        title="View Project Brief"
                                    >
                                        <Info size={20} />
                                    </button>

                                    {(() => {
                                        const p = assignedProjects.find(p => p.id === selectedProjectId);
                                        if (p && (p.status === 'in_progress' || p.status === 'active')) {
                                            return (
                                                <button
                                                    onClick={() => setCompletionModalOpen(true)}
                                                    className="absolute top-20 lg:top-20 top-[4.5rem] right-4 lg:right-6 z-40 px-4 lg:px-6 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                                >
                                                    <CheckCircle size={14} /> <span className="hidden sm:inline">Finish</span>
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center rounded-[48px] border-2 border-dashed border-border bg-surface shadow-soft transition-all">
                                <div className="w-24 h-24 rounded-[32px] bg-background flex items-center justify-center mb-8 text-muted/10">
                                    <Briefcase size={48} />
                                </div>
                                <h4 className="text-2xl font-black text-foreground mb-3 tracking-tighter">Initialize Work</h4>
                                <p className="text-muted text-sm font-medium">Select an assignment to start collaborating.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {projectToUpload && (
                <DeliverableUpload
                    isOpen={uploadModalOpen}
                    onClose={() => setUploadModalOpen(false)}
                    projectId={projectToUpload.id}
                    uploaderId={profile?.id || ''}
                    onUploadComplete={() => { }}
                />
            )}
            {selectedProjectId && (
                <CompletionModal
                    isOpen={completionModalOpen}
                    onClose={() => setCompletionModalOpen(false)}
                    projectId={selectedProjectId}
                    onComplete={() => window.location.reload()}
                />
            )}
        </DashboardLayout>
    );
};

export default WorkerDashboard;
