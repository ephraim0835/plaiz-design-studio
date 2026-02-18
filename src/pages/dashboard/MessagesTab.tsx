import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ProjectChat from '../../components/chat/ProjectChat';
import { MessageSquare, Search, ChevronRight, Briefcase } from 'lucide-react';

const MessagesTab = () => {
    const { profile, role } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const filter = role === 'admin' ? {} : role === 'client' ? { client_id: profile?.id } : { worker_id: profile?.id };
    const { projects, loading } = useProjects(filter);
    const selectedProjectId = searchParams.get('project');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <DashboardLayout title="Messages" hideBottomNav={!!selectedProjectId}>
            <div
                className="lg:origin-top lg:mx-auto"
                style={{
                    // Emulating the user's preference for 67% zoom on desktop
                    zoom: typeof window !== 'undefined' && window.innerWidth >= 1024 ? '0.67' : '1'
                } as any}
            >
                <div className="h-[calc(100vh/0.67-160px)] flex gap-0 lg:gap-8 animate-fade-in relative max-w-[1800px] mx-auto overflow-hidden">
                    {/* Project List Sidebar - Fixed-Feel for Desktop (Approx 25% width) */}
                    <div className={`w-full lg:w-[420px] flex flex-col shrink-0 border-r lg:border-r-0 border-border/50 lg:bg-surface/30 lg:backdrop-blur-md lg:rounded-[32px] lg:border lg:border-border/60 lg:shadow-xl lg:shadow-black/5 ${selectedProjectId ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-8 flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-4xl font-black text-foreground tracking-tighter">Inbox</h2>
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-muted-foreground/40 border border-border/50">
                                    <MessageSquare size={20} />
                                </div>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:opacity-100 group-focus-within:text-plaiz-blue transition-all" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    className="w-full h-14 bg-accent/5 border border-border/40 rounded-2xl pl-12 pr-4 text-[15px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-plaiz-blue/20 focus:border-plaiz-blue/40 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 rounded-[24px] bg-muted/40 animate-pulse mx-2" />)
                            ) : filteredProjects.length > 0 ? (
                                filteredProjects.map(project => (
                                    <button
                                        key={project.id}
                                        onClick={() => project.status !== 'matching' && setSearchParams({ project: project.id })}
                                        className={`w-full p-5 rounded-[28px] transition-all text-left flex items-center gap-5 group relative overflow-hidden
                                        ${project.status === 'matching' ? 'opacity-60 grayscale-[0.5] cursor-default' : ''}
                                        ${selectedProjectId === project.id
                                                ? 'bg-plaiz-blue text-white shadow-2xl shadow-plaiz-blue/30'
                                                : 'hover:bg-accent/5 text-foreground'}`}
                                    >
                                        <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center font-black text-xl shrink-0 transition-all duration-500 group-hover:scale-105
                                        ${selectedProjectId === project.id
                                                ? 'bg-white/20 text-white shadow-inner scale-105'
                                                : 'bg-gradient-to-br from-plaiz-blue/10 to-plaiz-cyan/10 border border-plaiz-blue/10 text-plaiz-blue'}`}>
                                            {project.title.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <h5 className={`font-bold text-[16px] truncate ${selectedProjectId === project.id ? 'text-white' : 'text-foreground'}`}>
                                                    {project.title}
                                                </h5>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full
                                                ${selectedProjectId === project.id ? 'bg-white/20 text-white' : 'bg-accent/10 text-muted-foreground'}`}>
                                                    {project.status === 'matching' ? 'Matching' : project.status.split('_')[0]}
                                                </span>
                                            </div>
                                            <p className={`text-[13px] truncate font-medium ${selectedProjectId === project.id ? 'text-white/70' : 'text-muted-foreground/50'}`}>
                                                {project.last_message ? (
                                                    <>
                                                        <span className={`font-bold mr-1 ${selectedProjectId === project.id ? 'text-white/60' : 'text-plaiz-blue/60'}`}>
                                                            {project.last_message.sender_id === profile?.id ? 'You' : project.last_message.sender_name?.split(' ')[0]}:
                                                        </span>
                                                        {project.last_message.content}
                                                    </>
                                                ) : 'No messages yet'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-12 text-center mx-4 mt-12 rounded-[40px] border-2 border-dashed border-border/50 bg-accent/5">
                                    <div className="w-16 h-16 rounded-[28px] bg-accent/10 flex items-center justify-center mx-auto mb-6 text-muted-foreground/20">
                                        <MessageSquare size={32} />
                                    </div>
                                    <p className="text-muted-foreground/40 text-[11px] font-black uppercase tracking-widest">No conversations found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Interface Container - Dominant Spatial focus (Approx 75% width) */}
                    <div className={`flex-1 transition-all duration-500 rounded-[48px] overflow-hidden ${selectedProjectId
                        ? 'flex flex-col fixed inset-0 z-50 bg-background pt-20 lg:pt-0 lg:static lg:bg-surface lg:rounded-[48px] lg:border lg:border-border/80 lg:shadow-2xl'
                        : 'hidden lg:flex lg:flex-col lg:bg-surface/20 lg:rounded-[48px] lg:border lg:border-dashed lg:border-border/60'
                        }`}>

                        {loading && selectedProjectId ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-12 h-12 border-4 border-plaiz-blue/20 border-t-plaiz-blue rounded-full animate-spin" />
                            </div>
                        ) : selectedProjectId && selectedProject ? (
                            <div className="flex-1 relative flex flex-col overflow-hidden">
                                <ProjectChat
                                    projectId={selectedProjectId}
                                    projectTitle={selectedProject.title}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 lg:p-24 bg-accent/5">
                                <div className="w-40 h-40 rounded-[64px] bg-gradient-to-br from-plaiz-blue/20 to-plaiz-cyan/20 border border-plaiz-blue/20 flex items-center justify-center mb-12 text-plaiz-blue shadow-3xl animate-pulse-slow">
                                    <MessageSquare size={72} strokeWidth={1} />
                                </div>
                                <h3 className="text-5xl font-black text-foreground mb-8 tracking-tighter">Immersive Creative Stream</h3>
                                <p className="text-muted-foreground text-2xl font-medium max-w-lg leading-relaxed mb-16">
                                    {selectedProjectId ? "Fetching project assets..." : "Select a conversation to enter your high-performance design workspace."}
                                </p>
                                <div className="flex flex-wrap justify-center gap-6">
                                    <div className="px-8 py-4 rounded-full bg-plaiz-blue/5 border border-plaiz-blue/10 text-[13px] font-black text-plaiz-blue uppercase tracking-widest shadow-sm">
                                        Spacious Interface
                                    </div>
                                    <div className="px-8 py-4 rounded-full bg-accent/10 border border-border/50 text-[13px] font-black text-muted-foreground uppercase tracking-widest shadow-sm">
                                        Enterprise Security
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MessagesTab;
