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

const WorkerDashboard: React.FC = () => {
    const { profile, specialization, workerStats, refreshProfile } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [completionModalOpen, setCompletionModalOpen] = useState(false);
    const [showBrief, setShowBrief] = useState(false);
    const [projectToUpload, setProjectToUpload] = useState<any>(null);
    const [toggling, setToggling] = useState(false);

    const { projects: assignedProjects, loading: assignedLoading, updateProject } = useProjects({
        worker_id: profile?.id,
        status: undefined // Get all assigned projects
    });

    const activeProjects = assignedProjects.filter(p => !['completed', 'cancelled'].includes(p.status));
    const completedProjectsCount = assignedProjects.filter(p => p.status === 'completed').length;

    const openUploadModal = (project: any) => {
        setProjectToUpload(project);
        setUploadModalOpen(true);
    };

    if (assignedLoading) return <LoadingScreen message="Syncing Grid Assignments..." />;

    return (
        <DashboardLayout title="Designer Studio">
            <div className="space-y-12 pb-20">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Active Projects"
                        value={activeProjects.length}
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
                        value={assignedProjects.filter(p => p.status === 'ready_for_review' || p.status === 'review').length}
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start min-h-[700px]">

                    {/* Project Selector - Col 4 */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hide">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Current Assignments</h2>
                            <span className="text-[10px] font-black text-plaiz-blue bg-plaiz-blue/10 px-3 py-1 rounded-full">{assignedProjects.length}</span>
                        </div>

                        {assignedProjects.length === 0 ? (
                            <div className="p-12 text-center rounded-[40px] border-2 border-dashed border-border bg-surface/50">
                                <Briefcase className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-muted/40 uppercase tracking-widest">No projects assigned</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assignedProjects.map(p => (
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

                    {/* Chat & Brief Interface - Col 8 */}
                    <div className="lg:col-span-8 flex flex-col h-[700px] relative">
                        {selectedProjectId ? (
                            <div className="h-full flex gap-4 transition-all duration-700">

                                {/* Info Panel (Self-contained within the chat area) */}
                                <div className={`transition-all duration-500 overflow-hidden relative
                                    ${showBrief ? 'w-full lg:w-80 opacity-100' : 'w-0 opacity-0'}`}>
                                    <div className="w-80 h-full bg-surface border border-border rounded-[40px] p-8 shadow-soft overflow-y-auto scrollbar-hide">
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

                                <div className="flex-1 relative lg:rounded-[40px] overflow-hidden border border-border shadow-soft bg-surface">
                                    <ProjectChat
                                        projectId={selectedProjectId}
                                        projectTitle={assignedProjects.find(p => p.id === selectedProjectId)?.title || 'Project Chat'}
                                    />

                                    {/* Project Brief Trigger */}
                                    <button
                                        onClick={() => setShowBrief(!showBrief)}
                                        className={`absolute top-20 left-6 z-50 p-4 rounded-2xl transition-all shadow-xl backdrop-blur-md border
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
                                                    className="absolute top-20 right-6 z-50 px-6 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                                >
                                                    <CheckCircle size={14} /> Finish Project
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
