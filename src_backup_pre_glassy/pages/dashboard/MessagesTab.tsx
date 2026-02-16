import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProjectChat from '../../components/chat/ProjectChat';
import { MessageSquare, Search, ChevronRight, Briefcase } from 'lucide-react';

const MessagesTab = () => {
    const { profile, role } = useAuth();
    const location = useLocation();
    const filter = role === 'admin' ? {} : role === 'client' ? { client_id: profile?.id } : { worker_id: profile?.id };
    const { projects, loading } = useProjects(filter);

    // Auto-select project from URL param
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
        const params = new URLSearchParams(location.search);
        return params.get('project');
    });
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <DashboardLayout title="Messages">
            <div className="h-[calc(100vh-160px)] flex gap-6 animate-fade-in">
                {/* Project List Sidebar */}
                {/* Project List Sidebar */}
                <div className="w-80 flex flex-col gap-6 shrink-0">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-black text-foreground px-2">Messages</h2>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:opacity-100 group-focus-within:text-primary transition-all" size={16} />
                            <input
                                type="text"
                                placeholder="Search project chats..."
                                className="w-full h-12 bg-accent/5 border border-border rounded-full pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)
                        ) : filteredProjects.length > 0 ? (
                            filteredProjects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => setSelectedProjectId(project.id)}
                                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group
                                        ${selectedProjectId === project.id
                                            ? 'bg-primary/10 border-primary shadow-sm'
                                            : 'bg-surface border-border hover:border-primary/20 hover:shadow-soft'}`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all
                                            ${selectedProjectId === project.id
                                                ? 'bg-primary text-primary-foreground shadow-glow'
                                                : 'bg-accent/10 border border-accent/20 text-plaiz-blue'}`}>
                                            {project.title.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className={`font-bold text-[14px] truncate transition-colors ${selectedProjectId === project.id ? 'text-foreground' : 'text-foreground/80'}`}>
                                                {project.title}
                                            </h5>
                                            <p className={`text-[10px] font-black uppercase tracking-widest truncate mt-1 transition-colors ${selectedProjectId === project.id ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                                {project.status.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className={`shrink-0 transition-transform ${selectedProjectId === project.id ? 'text-primary translate-x-1' : 'text-muted-foreground/20'}`} />
                                </button>
                            ))
                        ) : (
                            <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-accent/5">
                                <p className="text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest">No chats found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Interface Container */}
                <div className="flex-1 bg-surface rounded-[32px] overflow-hidden border border-border relative shadow-card transition-all duration-500">
                    {loading && selectedProjectId ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : selectedProjectId && selectedProject ? (
                        <ProjectChat
                            projectId={selectedProjectId}
                            projectTitle={selectedProject.title}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-accent/5">
                            <div className="w-24 h-24 rounded-[40px] bg-accent/10 border border-accent/20 flex items-center justify-center mb-8 text-plaiz-blue shadow-glow animate-pulse-slow">
                                <MessageSquare size={44} strokeWidth={1} />
                            </div>
                            <h3 className="text-3xl font-black text-foreground mb-4">Project Hub</h3>
                            <p className="text-muted-foreground font-medium max-w-sm leading-relaxed">
                                {selectedProjectId ? "Finding your project chat..." : "Select a project chat from the left to start collaborating with your team."}
                            </p>
                            <div className="mt-10 flex gap-4">
                                <div className="px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] shadow-sm">
                                    Project-Scoped
                                </div>
                                <div className="px-5 py-2.5 rounded-full bg-accent/20 border border-border text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] shadow-sm">
                                    Secure & Private
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MessagesTab;
