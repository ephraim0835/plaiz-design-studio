import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import ProjectCard from '../../components/dashboard/ProjectCard';
import ProjectChat from '../../components/chat/ProjectChat';
import AssignmentDetails from '../../components/AssignmentDetails';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useProjects } from '../../hooks/useProjects';
import { useWorkers } from '../../hooks/useWorkers';
import {
    Users,
    Briefcase,
    Activity,
    TrendingUp,
    MessageSquare,
    Image as ImageIcon,
    BarChart3,
    ChevronRight,
    Settings,
    Clock,
    Zap
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const { profile } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [showReasoning, setShowReasoning] = useState(false);
    const { projects, loading: projectsLoading, updateProject, refetch: refetchProjects } = useProjects();
    const { workers, loading: workersLoading } = useWorkers();

    const [totalUsersCount, setTotalUsersCount] = useState<number>(0);

    useEffect(() => {
        const fetchUserCount = async () => {
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            if (count !== null) setTotalUsersCount(count);
        };
        fetchUserCount();
    }, []);

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleForceAssign = async (workerId: string) => {
        if (!selectedProjectId) return;
        setActionLoading(selectedProjectId);
        try {
            const project = projects.find(p => p.id === selectedProjectId);
            const oldWorkerId = project?.worker_id;
            const { error } = await supabase.from('projects').update({ worker_id: workerId, status: 'in_progress', assignment_method: 'admin_override' }).eq('id', selectedProjectId);
            if (error) throw error;
            await supabase.rpc('increment_worker_active_projects', { worker_id_param: workerId });
            if (oldWorkerId && oldWorkerId !== workerId) {
                try { await supabase.rpc('decrement_worker_active_projects', { worker_id_param: oldWorkerId }); } catch (e) { }
            }
            refetchProjects();
            setShowReasoning(false);
        } catch (err: any) {
            console.error('Reassignment error:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const stats = [
        { title: 'Total Projects', value: (projects || []).length, icon: Briefcase, accentColor: 'blue' as const },
        { title: 'Queued', value: (projects || []).filter(p => p.status === 'queued').length, icon: Clock, accentColor: 'coral' as const },
        { title: 'Active', value: (projects || []).filter(p => p.status === 'in_progress').length, icon: Activity, accentColor: 'cyan' as const },
        { title: 'Users', value: totalUsersCount, icon: Users, accentColor: 'sky' as const },
    ];

    return (
        <DashboardLayout title="Admin Control">
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
                {/* Admin Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-surface p-12 border border-border shadow-xl shadow-black/5 transition-all">
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-foreground text-background text-[10px] font-bold uppercase tracking-widest mb-6">
                            <img src="/plaiz-logo.png" alt="System" className="w-3 h-3 object-contain" /> System Administrator
                        </span>
                        <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">
                            System Status: <span className="text-plaiz-blue uppercase">Optimal</span> 🔋
                        </h1>
                        <p className="text-muted font-medium max-w-lg text-lg">
                            Monitor studio performance, manage assignments, and <span className="text-foreground font-bold">ensure quality across all experts.</span>
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-1/4 h-full bg-plaiz-blue/5 blur-[100px] rounded-full translate-x-1/2" />
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-surface p-8 rounded-2xl border border-border shadow-soft hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-background rounded-xl text-plaiz-blue group-hover:bg-plaiz-blue/10 transition-colors">
                                    <stat.icon size={20} />
                                </div>
                                <span className="text-3xl font-extrabold text-foreground">{stat.value}</span>
                            </div>
                            <p className="text-[10px] font-bold text-muted/60 uppercase tracking-widest">{stat.title}</p>
                        </div>
                    ))}
                </div>

                {/* Control Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Stream Audit */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-xl font-bold text-foreground">Project Stream</h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide py-1">
                            {projectsLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />)
                            ) : projects.length > 0 ? (
                                projects.map(project => (
                                    <button
                                        key={project.id}
                                        onClick={() => setSelectedProjectId(project.id)}
                                        className={`w-full p-6 rounded-2xl border transition-all text-left flex items-center justify-between shadow-sm
                                                ${selectedProjectId === project.id
                                                ? 'bg-plaiz-blue/5 border-plaiz-blue/30'
                                                : 'bg-surface border-border hover:border-plaiz-blue/20'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                                                    ${selectedProjectId === project.id ? 'bg-plaiz-blue text-white shadow-md' : 'bg-background text-muted'}`}>
                                                {project.title.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-foreground text-sm mb-1">{project.title}</h5>
                                                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">
                                                    {project.status.toLowerCase() === 'queued' ? 'Curating Expert Team' : project.status.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className={selectedProjectId === project.id ? 'text-plaiz-blue' : 'text-muted/30'} />
                                    </button>
                                ))
                            ) : (
                                <div className="p-12 text-center rounded-3xl bg-surface border border-dashed border-border text-muted font-bold uppercase text-[10px] tracking-widest">
                                    No projects active
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Audit Stage */}
                    <div className="lg:col-span-8 h-[650px] sticky top-24 flex flex-col bg-surface rounded-3xl border border-border shadow-xl overflow-hidden transition-all">
                        {selectedProjectId ? (
                            <>
                                <div className="flex bg-background/50 p-2 border-b border-border">
                                    <button
                                        onClick={() => setShowReasoning(false)}
                                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${!showReasoning ? 'bg-surface text-plaiz-blue shadow-sm border border-border' : 'text-muted'}`}
                                    >
                                        Chat Monitor
                                    </button>
                                    <button
                                        onClick={() => setShowReasoning(true)}
                                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${showReasoning ? 'bg-surface text-plaiz-blue shadow-sm border border-border' : 'text-muted'}`}
                                    >
                                        AI Audit
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    {showReasoning ? (
                                        <div className="p-8 h-full overflow-y-auto">
                                            <AssignmentDetails
                                                metadata={projects.find(p => p.id === selectedProjectId)?.assignment_metadata}
                                                workers={workers}
                                                onReassign={handleForceAssign}
                                            />
                                        </div>
                                    ) : (
                                        <ProjectChat
                                            projectId={selectedProjectId}
                                            projectTitle={projects.find(p => p.id === selectedProjectId)?.title || 'Audit Monitoring'}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-surface shadow-inner">
                                <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center mb-6 text-muted/20">
                                    <Activity size={32} />
                                </div>
                                <h4 className="text-foreground font-extrabold text-xl mb-2 tracking-tight">System Audit Ready</h4>
                                <p className="text-muted text-sm font-medium">Select a project stream to monitor performance and chat quality.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Performance */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-foreground">Expert Network Status</h3>
                        <Link to="/admin/users" className="text-plaiz-blue text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-plaiz-cyan transition-colors">
                            Manage Experts <Settings size={14} />
                        </Link>
                    </div>
                    <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-soft transition-all">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-background/50 border-b border-border whitespace-nowrap">
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted">Expert</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted">Domain</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted">Rating</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted text-center">Load</th>
                                        <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-muted">Verification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {workersLoading ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Expert Data...</td></tr>
                                    ) : workers.map((worker: any) => {
                                        const stats = worker.worker_stats?.[0] || worker.worker_stats || {};
                                        return (
                                            <tr key={worker.id} className="hover:bg-background/50 transition-colors">
                                                <td className="p-6 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-plaiz-blue/10 text-plaiz-blue flex items-center justify-center text-[10px] font-bold border border-plaiz-blue/20">
                                                        {worker.full_name?.charAt(0) || 'E'}
                                                    </div>
                                                    <span className="font-bold text-foreground text-sm">{worker.full_name}</span>
                                                </td>
                                                <td className="p-6 text-sm text-muted capitalize">{worker.role?.replace('_', ' ')}</td>
                                                <td className="p-6 text-sm font-bold text-foreground">{stats.average_rating ? Number(stats.average_rating).toFixed(1) : '5.0'} ★</td>
                                                <td className="p-6 text-center">
                                                    <span className="px-2.5 py-1 bg-background rounded-lg text-[10px] font-bold text-muted border border-border">{stats.active_projects || 0}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${stats.is_probation ? 'bg-plaiz-coral/10 text-plaiz-coral border border-plaiz-coral/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                                        {stats.is_probation ? 'Probation' : 'Verified'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
