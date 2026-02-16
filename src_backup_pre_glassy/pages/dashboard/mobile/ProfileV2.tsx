import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    User,
    History,
    Bookmark,
    CreditCard,
    LifeBuoy,
    Settings,
    LogOut,
    ChevronRight,
    Camera,
    Shield,
    Sparkles,
    Mail,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TopNav from '../../../components/dashboard/TopNav';
import BottomNav from '../../../components/dashboard/BottomNav';
import BankDetailsSection from '../../../components/dashboard/BankDetailsSection';

const ProfileV2: React.FC = () => {
    const { profile, signOut } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 700);
        return () => clearTimeout(timer);
    }, []);

    const menuItems = [
        { icon: History, label: 'Activity History', color: 'text-plaiz-blue bg-plaiz-blue/10 border-plaiz-blue/20' },
        { icon: Bookmark, label: 'Saved Designs', color: 'text-plaiz-cyan bg-plaiz-cyan/10 border-plaiz-cyan/20' },
        { icon: Shield, label: 'Privacy & Security', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
        { icon: LifeBuoy, label: 'Help & Support', color: 'text-plaiz-blue bg-plaiz-blue/10 border-plaiz-blue/20' },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-muted/20 border-t-plaiz-blue rounded-full animate-spin mb-8 shadow-xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted">Synchronizing Identity...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32 lg:pb-0 lg:pt-20 overflow-x-hidden relative transition-all duration-700">
            <TopNav />

            <main className="max-w-2xl mx-auto px-6 py-10 lg:py-32 relative z-10">
                {/* Premium Identity Card */}
                <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="relative group">
                        <div className="w-40 h-40 lg:w-56 lg:h-56 rounded-[40px] bg-surface border-[6px] border-surface shadow-2xl overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-all duration-700">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl lg:text-6xl font-black text-muted/20 bg-background">
                                    {profile?.full_name?.[0] || 'U'}
                                </div>
                            )}
                        </div>
                        <Link to="/client/settings" className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-foreground border-4 border-surface shadow-xl flex items-center justify-center text-background hover:scale-110 active:scale-95 transition-all z-10">
                            <Camera size={20} />
                        </Link>
                    </div>

                    <div className="mt-10 text-center px-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-plaiz-blue/5 rounded-full border border-plaiz-blue/10 mb-5">
                            <Shield size={10} className="text-plaiz-blue fill-plaiz-blue" />
                            <span className="text-[9px] font-black text-plaiz-blue uppercase tracking-widest">
                                {profile?.role === 'worker' ? 'Verified Studio Expert' : 'Business Partner'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter mb-4">{profile?.full_name || 'System User'}</h1>

                        {profile?.bio && (
                            <p className="text-sm font-medium text-muted max-w-md mx-auto leading-relaxed mb-6 italic">
                                "{profile.bio}"
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-4 text-muted/60">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-background px-4 py-2 rounded-xl border border-border">
                                <Mail size={12} /> {profile?.email}
                            </div>
                            {profile?.phone && (
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-background px-4 py-2 rounded-xl border border-border">
                                    <Zap size={12} className="text-plaiz-blue" /> {profile.phone}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payout Section - Only for specialists/workers */}
                {['worker', 'designer', 'developer', 'specialist', 'graphic_designer', 'web_designer'].includes(profile?.role || '') && (
                    <div className="mb-12">
                        <BankDetailsSection />
                    </div>
                )}

                {/* Account Menu */}
                <div className="space-y-4 mb-16">
                    {menuItems.map((item, i) => (
                        <button
                            key={i}
                            className="w-full flex items-center justify-between p-6 bg-surface border border-border rounded-[24px] shadow-soft hover:shadow-xl transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110 ${item.color}`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="font-black text-foreground uppercase tracking-widest text-xs block">{item.label}</span>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">Platform Setting</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-muted/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>

                {/* Log Out */}
                <div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-between p-6 rounded-[28px] bg-surface border border-border hover:border-plaiz-coral/20 hover:bg-plaiz-coral/5 transition-all group active:scale-95 shadow-soft"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-plaiz-coral/10 border border-plaiz-coral/20 flex items-center justify-center text-plaiz-coral transition-all group-hover:scale-110">
                                <LogOut size={20} />
                            </div>
                            <div className="text-left">
                                <span className="font-black text-foreground uppercase tracking-widest text-xs block">Exit Studio</span>
                                <p className="text-[9px] font-bold text-plaiz-coral/40 uppercase tracking-widest mt-1">Secure Sign Out</p>
                            </div>
                        </div>
                        <ChevronRight size={24} className="text-muted/30 group-hover:text-plaiz-coral group-hover:translate-x-1 transition-all" />
                    </button>
                </div>

                {/* Footer Info */}
                <div className="mt-20 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted pr-2">Plaiz Systems • Version 2.5.0</p>
                    <div className="flex items-center gap-4 justify-center mt-3">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted/50">System Ready</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
            </main>

            <BottomNav onMenuClick={() => { }} />
        </div>
    );
};

export default ProfileV2;
