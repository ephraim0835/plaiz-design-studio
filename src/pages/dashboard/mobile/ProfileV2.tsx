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
    Zap,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TopNav from '../../../components/dashboard/TopNav';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import BankDetailsSection from '../../../components/dashboard/BankDetailsSection';
import { supabase } from '../../../lib/supabaseClient';

const ProfileV2: React.FC = () => {
    const { profile, user, signOut, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 700);
        return () => clearTimeout(timer);
    }, []);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`; // Matches RLS policy requirement

            // 1. Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update profile record
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 4. Refresh local state
            await refreshProfile();
        } catch (err: any) {
            console.error('Avatar upload failed:', err);
            alert(`Upload failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const isActiveWorker = ['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(profile?.role || '');
    const basePath = profile?.role === 'admin' ? '/admin' : isActiveWorker ? '/worker' : '/client';

    const menuItems = [
        {
            icon: Shield,
            label: 'Privacy & Security',
            route: `${basePath}/privacy`,
            description: 'Manage your account safety, privacy settings, and data protection.',
            color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
        },
        {
            icon: LifeBuoy,
            label: 'Help & Support',
            route: `${basePath}/support`,
            description: 'Get assistance, report issues, and find answers to common questions.',
            color: 'text-plaiz-blue bg-plaiz-blue/10 border-plaiz-blue/20',
            hidden: profile?.role === 'admin'
        },
    ].filter(item => !item.hidden);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-muted/20 border-t-plaiz-blue rounded-full animate-spin mb-8 shadow-xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted">Synchronizing Identity...</p>
            </div>
        );
    }

    return (
        <DashboardLayout title="Identity">
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

                            {/* In-container loading overlay */}
                            {isUploading && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                                    <Loader2 className="w-10 h-10 animate-spin text-plaiz-blue" />
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-foreground border-4 border-surface shadow-xl flex items-center justify-center text-background hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer">
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                            />
                        </label>
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

                <div className="space-y-4 mb-16">
                    {menuItems.map((item, i) => (
                        <Link
                            key={i}
                            to={item.route}
                            className="w-full flex items-center justify-between p-6 bg-surface border border-border rounded-[24px] shadow-soft hover:shadow-xl transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110 ${item.color}`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="font-black text-foreground uppercase tracking-widest text-xs block">{item.label}</span>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-muted/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                        </Link>
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
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted pr-2">Plaiz Studio Systems • Version 2.5.0</p>
                    <div className="flex items-center gap-4 justify-center mt-3">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted/50">System Ready</p>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
};

export default ProfileV2;
