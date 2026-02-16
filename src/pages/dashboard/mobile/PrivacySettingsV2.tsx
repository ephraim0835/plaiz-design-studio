import React from 'react';
import {
    Lock,
    CreditCard,
    Trash2,
    ChevronLeft,
    CheckCircle2,
    Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

const PrivacySettingsV2: React.FC = () => {
    const navigate = useNavigate();

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) {
            alert("Account deactivation request sent to admin.");
        }
    };

    const handlePasswordUpdate = () => {
        alert("Redirecting to secure password reset flow...");
        // In a real app, navigate to a specific password reset page
    };

    const handleViewLog = () => {
        alert("Fetching recent activity logs... (Demo Mode)");
    };

    const SectionHeader = ({ title, icon: Icon, color }: { title: string, icon: any, color: string }) => (
        <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{title}</h3>
        </div>
    );

    const SettingItem = ({ label, description, children, icon: Icon }: { label: string, description: string, children: React.ReactNode, icon?: any }) => (
        <div className="p-6 bg-surface border border-border rounded-3xl mb-4 group hover:border-plaiz-blue/20 transition-all">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {Icon && <Icon size={12} className="text-muted/60" />}
                        <span className="text-xs font-black text-foreground uppercase tracking-widest">{label}</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-normal">
                        {description}
                    </p>
                </div>
                <div className="flex-shrink-0">
                    {children}
                </div>
            </div>
        </div>
    );

    const TrustNote = ({ text }: { text: string }) => (
        <div className="flex gap-3 mb-3">
            <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-relaxed">{text}</p>
        </div>
    );

    return (
        <DashboardLayout title="Privacy & Security">
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
                    <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter mb-4">Privacy & Security</h1>
                    <p className="text-sm font-medium text-muted">Manage your account safety, password, and data protection.</p>
                </div>

                {/* Account Security Section */}
                <div className="mb-12">
                    <SectionHeader title="Account Security" icon={Lock} color="text-plaiz-blue bg-plaiz-blue/10 border border-plaiz-blue/20" />

                    <SettingItem
                        label="Change Password"
                        description="Update your account password to keep your studio data safe."
                        icon={Activity}
                    >
                        <button
                            onClick={handlePasswordUpdate}
                            className="px-4 py-2 bg-background border border-border rounded-xl text-[10px] font-black text-foreground uppercase tracking-widest hover:bg-surface transition-colors shadow-sm active:scale-95"
                        >
                            Update
                        </button>
                    </SettingItem>

                    <SettingItem
                        label="Login Activity"
                        description="Monitor recent sign-ins to verify your account usage."
                        icon={Activity}
                    >
                        <button
                            onClick={handleViewLog}
                            className="text-[10px] font-black text-plaiz-blue uppercase tracking-widest hover:underline active:opacity-70"
                        >
                            View Log
                        </button>
                    </SettingItem>
                </div>

                {/* Project Privacy & Trust */}
                <div className="mb-12 pt-12 border-t border-border">
                    <SectionHeader title="Project & Payment Safety" icon={CreditCard} color="text-amber-500 bg-amber-500/10 border border-amber-500/20" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-surface border border-border rounded-3xl">
                            <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-6">Execution Privacy</h4>
                            <TrustNote text="Your files are only visible to assigned workers and system admin." />
                            <TrustNote text="Chats are private and protected within the studio platform." />
                            <TrustNote text="Project brief data is encrypted during transit and storage." />
                        </div>

                        <div className="p-8 bg-surface border border-border rounded-3xl">
                            <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-6">Payment Integrity</h4>
                            <TrustNote text="Payments are protected by escrow-style milestone releases." />
                            <TrustNote text="Every minute of work is tracked for quality assurance." />
                            <TrustNote text="Admin oversight exists to resolve any safety or quality concerns." />
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="mt-20 pt-10 border-t border-border">
                    <div className="flex items-center justify-between gap-6 p-8 bg-plaiz-coral/5 border border-plaiz-coral/10 rounded-[32px]">
                        <div>
                            <span className="text-xs font-black text-plaiz-coral uppercase tracking-widest block mb-1">Account Control</span>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Deactivation and final removal from system.</p>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-6 py-3 bg-plaiz-coral/10 border border-plaiz-coral/20 rounded-2xl text-plaiz-coral hover:bg-plaiz-coral/20 transition-all active:scale-95 group"
                        >
                            <Trash2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
                        </button>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-16 text-center animate-pulse">
                    <p className="text-[9px] font-black text-plaiz-blue/60 uppercase tracking-[0.4em]">Active Platform Guardian • Connected</p>
                </div>
            </main>
        </DashboardLayout>
    );
};

export default PrivacySettingsV2;
