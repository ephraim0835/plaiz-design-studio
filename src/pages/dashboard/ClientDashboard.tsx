import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import ProjectCard from '../../components/dashboard/ProjectCard';
import ProjectChat from '../../components/chat/ProjectChat';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import {
    Folder,
    Clock,
    MessageSquare,
    Image as ImageIcon,
    Plus,
    ChevronRight,
    Zap,
    ArrowRight,
} from 'lucide-react';
import ReviewModal from '../../components/project/ReviewModal';
import ServiceSelectionModal from '../../components/project/ServiceSelectionModal';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PaymentModal from '../../components/project/PaymentModal';
import { supabase } from '../../lib/supabaseClient';
import HomeV2 from './mobile/HomeV2';

const ClientDashboard: React.FC = () => {
    const { profile } = useAuth();
    const { projects, loading, refetch } = useProjects({ client_id: profile?.id });
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [projectToReview, setProjectToReview] = useState<any>(null);
    const [projectToPay, setProjectToPay] = useState<any>(null);
    const [activeAgreement, setActiveAgreement] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.selectedProjectId) {
            setSelectedProjectId(location.state.selectedProjectId);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleProjectClick = async (project: any) => {
        if (project.status === 'pending_down_payment' || project.status === 'awaiting_final_payment') {
            try {
                const { data: agreement } = await supabase
                    .from('agreements')
                    .select('*')
                    .eq('project_id', project.id)
                    .eq('status', 'accepted')
                    .single();

                if (agreement) {
                    setActiveAgreement(agreement);
                    setProjectToPay(project);
                    setPaymentModalOpen(true);
                } else {
                    setSelectedProjectId(project.id);
                }
            } catch (e) {
                setSelectedProjectId(project.id);
            }
        } else {
            setSelectedProjectId(project.id);
        }
    };

    const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Member';

    const stats = [
        { title: 'My Projects', value: projects.length, icon: Folder, accentColor: 'blue' as const },
        { title: 'Started', value: projects.filter(p => p.status === 'in_progress' || p.status === 'review' || p.status === 'active').length, icon: Clock, accentColor: 'cyan' as const },
        { title: 'Done', value: projects.filter(p => p.status === 'completed').length, icon: Clock, accentColor: 'sky' as const },
    ];

    return (
        <DashboardLayout title="Client Dashboard">
            {/* Mobile Home View */}
            <div className="lg:hidden">
                {!selectedProjectId && <HomeV2 />}
            </div>

            <div className={`max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 ${selectedProjectId ? 'block' : 'hidden lg:block'}`}>
                {/* Friendly Greeting */}
                <div className="mb-0">
                    <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tighter">
                        Hi {firstName} <span className="text-plaiz-blue/60 inline-block">👋</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted font-medium">
                        What can we build for you? <span className="text-plaiz-blue">Let's create something useful.</span>
                    </p>
                </div>

                {/* High-Impact Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-surface p-12 border border-border shadow-xl shadow-black/5 transition-all">
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-plaiz-blue/10 text-plaiz-blue text-[10px] font-bold uppercase tracking-widest mb-6 border border-plaiz-blue/20">
                            <img src="/plaiz-logo.png" alt="Verified" className="w-3 h-3 object-contain" /> Studio Member
                        </span>
                        <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">
                            Your project stream is active.
                        </h1>
                        <p className="text-muted font-medium max-w-lg text-lg">
                            Track your work and <span className="text-plaiz-blue">get reliable digital services for your brand.</span>
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-plaiz-blue/5 blur-[100px] rounded-full translate-x-1/2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                {/* Workflow Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Project Explorer */}
                    <div className="lg:col-span-4 space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-foreground">My Projects</h3>
                                <Link to="/client/projects" className="text-plaiz-blue text-xs font-bold uppercase tracking-widest hover:text-plaiz-cyan transition-colors">
                                    View All
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse border border-border" />)
                                ) : projects.length > 0 ? (
                                    projects.slice(0, 5).map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleProjectClick(project)}
                                            className={`w-full p-6 rounded-2xl border transition-all text-left flex items-center justify-between
                                                        ${selectedProjectId === project.id
                                                    ? 'bg-plaiz-blue/5 border-plaiz-blue/30 shadow-md shadow-plaiz-blue/5'
                                                    : 'bg-surface border-border hover:border-plaiz-blue/20 shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                                                            ${selectedProjectId === project.id ? 'bg-plaiz-blue text-white' : 'bg-background text-muted'}`}>
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
                                    <div className="p-12 text-center rounded-3xl bg-surface border border-dashed border-border transition-all">
                                        <p className="text-foreground font-bold mb-2">No projects yet</p>
                                        <p className="text-muted text-xs mb-8">Ready to start? Let's create something new.</p>
                                        <button onClick={() => setServiceModalOpen(true)} className="px-8 py-3 bg-plaiz-blue text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.05] active:scale-[0.95] transition-all">
                                            Start Project
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Create Section */}
                        <div className="p-8 rounded-3xl bg-gray-900 text-white shadow-2xl relative overflow-hidden group">
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-8 text-muted/60 relative z-10">New Project</h3>
                            <div className="space-y-4 relative z-10">
                                <button onClick={() => navigate('/client/request?type=graphic')} className="w-full p-4 rounded-xl bg-surface border border-border flex items-center justify-between hover:bg-background transition-all group">
                                    <span className="font-bold text-sm tracking-tight text-foreground">Graphic Design</span>
                                    <ArrowRight size={16} className="text-muted group-hover:text-plaiz-blue transition-colors" />
                                </button>
                                <button onClick={() => navigate('/client/request?type=web')} className="w-full p-4 rounded-xl bg-surface border border-border flex items-center justify-between hover:bg-background transition-all group">
                                    <span className="font-bold text-sm tracking-tight text-foreground">Web Design</span>
                                    <ArrowRight size={16} className="text-muted group-hover:text-plaiz-blue transition-colors" />
                                </button>
                                <button onClick={() => setServiceModalOpen(true)} className="w-full p-4 rounded-xl bg-plaiz-blue text-white border border-blue-400/20 flex items-center justify-between hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/10">
                                    <span className="font-bold text-sm tracking-tight">More Services</span>
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-plaiz-blue/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000" />
                        </div>
                    </div>

                    {/* Chat Stage */}
                    <div className="lg:col-span-8 h-[650px] sticky top-24">
                        {selectedProjectId ? (
                            <ProjectChat
                                projectId={selectedProjectId}
                                projectTitle={projects.find(p => p.id === selectedProjectId)?.title || 'Project Chat'}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border bg-surface shadow-soft transition-all">
                                <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center mb-6 text-muted/20">
                                    <MessageSquare size={32} />
                                </div>
                                <h4 className="text-foreground font-extrabold text-xl mb-2">Pick a project</h4>
                                <p className="text-muted text-sm font-medium">Choose a project to start.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                {
                    projectToReview && (
                        <ReviewModal
                            isOpen={reviewModalOpen}
                            onClose={() => setReviewModalOpen(false)}
                            projectId={projectToReview.id}
                            workerId={projectToReview.worker_id}
                            clientId={profile?.id || ''}
                            onReviewSubmitted={refetch}
                        />
                    )
                }

                <ServiceSelectionModal
                    isOpen={serviceModalOpen}
                    onClose={() => setServiceModalOpen(false)}
                    onSelect={(service) => {
                        setServiceModalOpen(false);
                        navigate(`/client/request?service=${service.id}`);
                    }}
                />

                {
                    projectToPay && activeAgreement && (
                        <PaymentModal
                            isOpen={paymentModalOpen}
                            onClose={() => setPaymentModalOpen(false)}
                            amount={projectToPay.status === 'pending_down_payment' ? activeAgreement.deposit_amount : activeAgreement.balance_amount}
                            projectId={projectToPay.id}
                            phase={projectToPay.status === 'pending_down_payment' ? 'deposit_40' : 'balance_60'}
                            onSuccess={async () => {
                                refetch();
                                setPaymentModalOpen(false);
                                setSelectedProjectId(projectToPay.id);
                            }}
                        />
                    )
                }
            </div>
        </DashboardLayout>
    );
};

export default ClientDashboard;
