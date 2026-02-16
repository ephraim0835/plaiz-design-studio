import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProjectCard from '../../components/dashboard/ProjectCard';
import { Briefcase, Search, Filter, Plus, ChevronRight, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ProjectStatus } from '../../types';
import ServiceSelectionModal from '../../components/project/ServiceSelectionModal';

const ProjectsTab = () => {
    const { profile, role } = useAuth();
    const filter = role === 'admin' ? {} : role === 'client' ? { client_id: profile?.id } : { worker_id: profile?.id };
    const { projects, loading, updateProject } = useProjects(filter);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const navigate = useNavigate();

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusCount = (status: ProjectStatus) => projects.filter(p => p.status === status).length;

    return (
        <>
            <DashboardLayout title="Projects">
                <div className="space-y-8 animate-fade-in pb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-3xl font-black text-foreground tracking-tight">Projects</h2>
                            <p className="text-muted font-medium">Manage and track project progress</p>
                        </div>
                        {role === 'client' && (
                            <button
                                onClick={() => setServiceModalOpen(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={18} /> New Project
                            </button>
                        )}
                    </div>

                    {/* Filters & search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-plaiz-cyan transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="w-full bg-surface border border-border rounded-2xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-plaiz-cyan/30 transition-all placeholder:text-muted/40"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {(['all', 'pending', 'in_progress', 'review', 'completed', 'flagged'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border
                                    ${statusFilter === status
                                            ? 'bg-plaiz-cyan/20 border-plaiz-cyan/30 text-plaiz-cyan'
                                            : 'bg-surface border-border text-muted hover:border-border hover:text-foreground'}`}
                                >
                                    {status.replace('_', ' ')}
                                    {status !== 'all' && (
                                        <span className="ml-2 opacity-50">({getStatusCount(status as ProjectStatus)})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 rounded-[32px] bg-surface animate-pulse border border-border" />)}
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {filteredProjects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-border bg-surface shadow-soft transition-all">
                            <div className="w-20 h-20 rounded-[30px] bg-background flex items-center justify-center mb-6 text-muted/30">
                                <Briefcase size={40} />
                            </div>
                            <h4 className="text-foreground font-black text-xl mb-2">No projects found</h4>
                            <p className="text-muted text-sm font-medium">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </div>
            </DashboardLayout>
            <ServiceSelectionModal
                isOpen={serviceModalOpen}
                onClose={() => setServiceModalOpen(false)}
                onSelect={(service) => {
                    setServiceModalOpen(false);
                    navigate(`/client/request?service=${service.service_id}`);
                }}
            />
        </>
    );
};

export default ProjectsTab;
