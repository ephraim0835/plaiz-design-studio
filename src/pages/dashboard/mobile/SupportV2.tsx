import React, { useState } from 'react';
import {
    LifeBuoy,
    MessageSquare,
    AlertTriangle,
    Users,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Search,
    HelpCircle,
    ArrowRight,
    ShieldAlert,
    PhoneCall,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../hooks/useProjects';
import { supabase } from '../../../lib/supabaseClient';

const SupportV2: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { projects, createProject } = useProjects({ client_id: user?.id });
    const [searchQuery, setSearchQuery] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const faqs = [
        {
            q: "How long does assignment take?",
            a: "Typically, an expert worker is assigned within 2-4 hours. For complex projects, it may take up to 12 hours to ensure the best fit."
        },
        {
            q: "Can I change my worker?",
            a: "Yes. If you feel the assigned worker isn't the right fit, you can contact admin to request a reassignment."
        },
        {
            q: "What if I'm not satisfied with the work?",
            a: "We offer multiple revision rounds. If issues persist, our quality assurance team will step in to mediate and resolve the problem."
        },
        {
            q: "How do revisions work?",
            a: "Standard projects include up to 3 major revisions. Minor tweaks are usually unlimited until you are satisfied."
        }
    ];

    const handleConnectSupport = async (title: string = "Direct Admin Support") => {
        if (!user) return;
        setIsConnecting(true);

        try {
            // 1. Look for existing support project
            const existingSupport = projects.find(p => p.title === "Direct Admin Support");

            if (existingSupport) {
                navigate(`/client/messages?project=${existingSupport.id}`);
                return;
            }

            // 2. Create new support project if not found
            const result = await createProject({
                title: "Direct Admin Support",
                description: `Support session initiated for ${user.email}. Context: ${title}`,
                project_type: 'graphic_design', // Defaulting to an existing type to avoid DB constraint issues
                status: 'queued',
                client_id: user.id
            });

            if (result.success && result.data) {
                // Send an initial system message to trigger the stream
                await supabase.from('messages').insert([
                    {
                        project_id: result.data.id,
                        sender_id: user.id,
                        content: `System: ${title} requested. Connecting to admin stream...`,
                        payload: { type: 'system_alert', context: title }
                    }
                ]);

                navigate(`/client/messages?project=${result.data.id}`);
            } else {
                alert("Failed to establish secure connection. Please try again.");
            }
        } catch (err) {
            console.error("Support connection error:", err);
            alert("A connection error occurred.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleContactAdmin = () => {
        handleConnectSupport("Emergency Support");
    };

    const handleFeatureClick = (title: string) => {
        if (title === "Contact Support") {
            handleConnectSupport("General Support");
        } else {
            handleConnectSupport(`Issue Report: ${title}`);
        }
    };

    const handleGuideClick = (title: string) => {
        alert(`Opening Guide: ${title}`);
    };

    const HelpCard = ({ title, description, icon: Icon, onClick, color }: { title: string, description: string, icon: any, onClick?: () => void, color: string }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-6 bg-surface border border-border rounded-[32px] shadow-soft hover:shadow-xl transition-all group active:scale-[0.98]"
        >
            <div className="flex items-center gap-6 text-left">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 ${color}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <span className="font-black text-foreground uppercase tracking-widest text-xs block mb-1">{title}</span>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest max-w-[200px] leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
            <ChevronRight size={20} className="text-muted/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </button>
    );

    const GuideItem = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <button
            onClick={() => handleGuideClick(title)}
            className="p-6 bg-surface border border-border rounded-3xl flex flex-col items-center gap-4 hover:border-plaiz-blue/20 transition-all text-center group active:scale-95"
        >
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted group-hover:text-plaiz-blue transition-colors">
                <Icon size={20} />
            </div>
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{title}</span>
        </button>
    );

    return (
        <DashboardLayout title="Help & Support">
            <main className="max-w-2xl mx-auto px-6 py-10 pb-32 relative z-10">
                {/* Header Navigation */}
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-12 group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Identity</span>
                </button>

                <div className="mb-16">
                    <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter mb-4">Help & Support</h1>
                    <p className="text-sm font-medium text-muted">Get assistance, report issues, and find answers to common questions.</p>
                </div>

                {/* Emergency Banner */}
                <div className="mb-16 p-8 bg-plaiz-blue/5 border border-plaiz-blue/10 rounded-[40px] relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert size={14} className="text-plaiz-blue" />
                                <span className="text-[11px] font-black text-plaiz-blue uppercase tracking-widest leading-normal">Emergency Support</span>
                            </div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Having an urgent issue?</h2>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-[0.15em] leading-relaxed">Contact admin for immediate dedicated assistance.</p>
                        </div>
                        <button
                            onClick={handleContactAdmin}
                            disabled={isConnecting}
                            className="flex items-center gap-3 px-8 py-4 bg-plaiz-blue text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-plaiz-blue/20 disabled:opacity-50 disabled:scale-100"
                        >
                            {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <PhoneCall size={18} />}
                            <span className="text-[11px] font-black uppercase tracking-widest">{isConnecting ? 'Connecting...' : 'Connect to Admin'}</span>
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-plaiz-blue/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000" />
                </div>

                {/* Quick Help Section */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-plaiz-blue bg-plaiz-blue/10 border border-plaiz-blue/20">
                            <LifeBuoy size={16} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Quick Help Options</h3>
                    </div>

                    <div className="space-y-4">
                        <HelpCard
                            title="Contact Support"
                            description="Start a live chat with our platform specialists."
                            icon={MessageSquare}
                            onClick={() => handleFeatureClick("Contact Support")}
                            color="text-plaiz-blue bg-plaiz-blue/10 border-plaiz-blue/20"
                        />
                        <HelpCard
                            title="Report a Problem"
                            description="Technical issues or bugs affecting your experience."
                            icon={AlertTriangle}
                            onClick={() => handleFeatureClick("Report a Problem")}
                            color="text-amber-500 bg-amber-500/10 border-amber-500/20"
                        />
                        <HelpCard
                            title="Report a Worker"
                            description="Concerns regarding communication or work behavior."
                            icon={Users}
                            onClick={() => handleFeatureClick("Report a Worker")}
                            color="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                        />
                        <HelpCard
                            title="Payment Issue"
                            description="Billing errors, refund status, or checkout failure."
                            icon={CreditCard}
                            onClick={() => handleFeatureClick("Payment Issue")}
                            color="text-plaiz-cyan bg-plaiz-cyan/10 border-plaiz-cyan/20"
                        />
                    </div>
                </div>

                {/* Help Guides Section */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-plaiz-cyan bg-plaiz-cyan/10 border border-plaiz-cyan/20">
                            <HelpCircle size={16} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Guides Section</h3>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <GuideItem title="Submit Project" icon={ArrowRight} />
                        <GuideItem title="Worker Assignment" icon={Users} />
                        <GuideItem title="Payments" icon={CreditCard} />
                        <GuideItem title="Progress Track" icon={Search} />
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mb-16 pt-16 border-t border-border">
                    <div className="flex items-center gap-3 mb-10">
                        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">FAQ Reassurance</h3>
                    </div>

                    <div className="space-y-8">
                        {faqs.map((faq, i) => (
                            <div key={i} className="group">
                                <h4 className="text-[13px] font-black text-foreground uppercase tracking-tighter mb-3 group-hover:text-plaiz-blue transition-colors">
                                    {faq.q}
                                </h4>
                                <p className="text-[11px] font-medium text-muted/80 leading-relaxed uppercase tracking-widest">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <p className="text-[9px] font-black text-muted/40 uppercase tracking-[0.5em]">You are not alone • The studio is with you</p>
                </div>
            </main>
        </DashboardLayout>
    );
};

export default SupportV2;
