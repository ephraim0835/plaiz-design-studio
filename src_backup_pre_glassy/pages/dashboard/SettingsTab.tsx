import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Profile, WorkerStats, UserRole } from '../../types';
import {
    User, Lock, Shield, Bell, Monitor, Save,
    LogOut, Trash2, Camera, Check, AlertCircle, Briefcase,
    Zap, Sliders, Globe, Mail, ChevronRight
} from 'lucide-react';
import PasswordInput from '../../components/PasswordInput';
import { WORKER_SPECIALIZATIONS } from '../../config/specializations';

const SettingsTab = () => {
    const { profile, user, role, workerStats, signOut, refreshProfile } = useAuth();
    const [activeSection, setActiveSection] = useState<'profile' | 'account' | 'role' | 'admin'>('profile');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [adminStats, setAdminStats] = useState({ totalUsers: 0, activeProjects: 0 });

    // Form States
    const [formData, setFormData] = useState({
        full_name: (profile?.full_name || '') as string,
        avatar_url: (profile?.avatar_url || '') as string,
        phone: (profile?.phone || '') as string,
        bio: (profile?.bio || '') as string,
        preferred_comm_method: (profile?.preferred_comm_method || 'email') as string,
        notifications: (profile?.notification_preferences || { project_updates: true, messages: true, marketing: false }) as {
            project_updates: boolean;
            messages: boolean;
            marketing: boolean;
        }
    });

    const [workerData, setWorkerData] = useState({
        availability_status: (workerStats?.availability_status || 'available') as 'available' | 'busy' | 'away',
        max_projects_limit: (workerStats?.max_projects_limit || 3) as number,
        portfolio_visible: (workerStats?.portfolio_visible ?? true) as boolean,
        skills: (workerStats?.skills || []) as string[],
        minimum_price: (profile?.minimum_price || null) as number | null
    });

    const [adminSettings, setAdminSettings] = useState<any[]>([]);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        if (role === 'admin' && activeSection === 'admin') {
            fetchAdminSettings();
            fetchAdminStats();
        }
    }, [activeSection, role]);

    const fetchAdminStats = async () => {
        try {
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
            setAdminStats({
                totalUsers: usersCount || 0,
                activeProjects: projectsCount || 0
            });
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        }
    };

    const fetchAdminSettings = async () => {
        const { data, error } = await supabase.from('system_settings').select('*');
        if (!error) setAdminSettings(data);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    avatar_url: formData.avatar_url,
                    phone: formData.phone,
                    bio: formData.bio,
                    preferred_comm_method: formData.preferred_comm_method,
                    notification_preferences: formData.notifications
                })
                .eq('id', user.id);

            if (error) throw error;
            await refreshProfile();
            setStatus({ type: 'success', message: 'Profile updated successfully!' });
            setHasChanges(false);
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWorkerStats = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const { error: statsError } = await supabase
                .from('worker_stats')
                .update({
                    availability_status: workerData.availability_status,
                    max_projects_limit: workerData.max_projects_limit,
                    portfolio_visible: workerData.portfolio_visible,
                    skills: workerData.skills
                })
                .eq('worker_id', user.id);

            if (statsError) throw statsError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    minimum_price: workerData.minimum_price
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            await refreshProfile();
            setStatus({ type: 'success', message: 'Worker engine synchronized!' });
            setHasChanges(false);
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setStatus(null);

        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}-${Math.random()}.${fileExt}`;

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            setHasChanges(true);
            setStatus({ type: 'success', message: 'Avatar uploaded! Click Save to apply.' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            setStatus({ type: 'error', message: 'Passwords do not match' });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new });
            if (error) throw error;
            setStatus({ type: 'success', message: 'Password updated successfully!' });
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This will mark your profile as inactive.')) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: false })
                .eq('id', user.id);
            if (error) throw error;
            await signOut();
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const updateAdminSetting = async (key: string, value: any) => {
        try {
            const { error } = await supabase
                .from('system_settings')
                .update({ value })
                .eq('key', key);
            if (error) throw error;
            fetchAdminSettings();
            setStatus({ type: 'success', message: 'System setting updated' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const isActiveWorker = role === 'graphic_designer' || role === 'web_designer';

    return (
        <DashboardLayout title="Settings">
            <div className="animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 transition-colors">
                    <div>
                        <h2 className="text-4xl font-black text-foreground tracking-tighter">Settings</h2>
                        <p className="text-muted font-medium">Manage your professional studio identity.</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Settings Sidebar */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-surface border border-border p-4 flex flex-col gap-2 shadow-xl rounded-[32px] transition-all">
                            <button
                                onClick={() => setActiveSection('profile')}
                                className={`flex items-center gap-4 px-6 py-5 rounded-[20px] transition-all font-black text-[10px] uppercase tracking-[0.2em]
                                    ${activeSection === 'profile'
                                        ? 'bg-foreground text-background shadow-2xl'
                                        : 'text-muted hover:text-foreground hover:bg-background/50'}`}
                            >
                                <User size={18} /> Profile Identity
                            </button>
                            <button
                                onClick={() => setActiveSection('account')}
                                className={`flex items-center gap-4 px-6 py-5 rounded-[20px] transition-all font-black text-[10px] uppercase tracking-[0.2em]
                                    ${activeSection === 'account'
                                        ? 'bg-foreground text-background shadow-2xl'
                                        : 'text-muted hover:text-foreground hover:bg-background/50'}`}
                            >
                                <Lock size={18} /> Safety & Access
                            </button>
                            {(isActiveWorker || role === 'client') && (
                                <button
                                    onClick={() => setActiveSection('role')}
                                    className={`flex items-center gap-4 px-6 py-5 rounded-[20px] transition-all font-black text-[10px] uppercase tracking-[0.2em]
                                        ${activeSection === 'role'
                                            ? 'bg-foreground text-background shadow-2xl'
                                            : 'text-muted hover:text-foreground hover:bg-background/50'}`}
                                >
                                    {isActiveWorker ? <Briefcase size={18} /> : <Zap size={18} />}
                                    {isActiveWorker ? 'Studio Engine' : 'Project Flux'}
                                </button>
                            )}
                            {role === 'admin' && (
                                <button
                                    onClick={() => setActiveSection('admin')}
                                    className={`flex items-center gap-4 px-6 py-5 rounded-[20px] transition-all font-black text-[10px] uppercase tracking-[0.2em]
                                        ${activeSection === 'admin'
                                            ? 'bg-plaiz-coral text-white shadow-2xl'
                                            : 'text-muted hover:text-plaiz-coral hover:bg-plaiz-coral/5'}`}
                                >
                                    <Shield size={18} /> System Command
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Settings Content */}
                    <div className="flex-1 space-y-8">
                        {status && (
                            <div className={`p-6 rounded-3xl border flex items-center gap-4 text-[10px] font-black uppercase tracking-widest animate-slide-up shadow-xl
                                ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                                {status.message}
                            </div>
                        )}

                        {activeSection === 'profile' && (
                            <div className="bg-surface border border-border p-8 md:p-14 space-y-12 shadow-2xl rounded-[40px] transition-all">
                                <div className="flex items-center gap-10">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-plaiz-cyan to-plaiz-blue flex items-center justify-center text-4xl font-black text-white shadow-2xl overflow-hidden border-4 border-background">
                                            {uploading ? (
                                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white" />
                                            ) : formData.avatar_url ? (
                                                <img src={formData.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-plaiz-cyan text-white flex items-center justify-center shadow-lg border-2 border-plaiz-void cursor-pointer hover:scale-110 transition-all">
                                            <Camera size={14} />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                        </label>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-foreground mb-1">Personal Info</h4>
                                        <p className="text-muted text-sm font-medium">Update your public identity on the platform</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted px-1">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-border rounded-2xl py-4 px-6 text-foreground focus:outline-none focus:border-plaiz-blue/30 transition-all font-medium"
                                            value={formData.full_name}
                                            onChange={(e) => { setFormData({ ...formData, full_name: e.target.value }); setHasChanges(true); }}
                                        />
                                    </div>
                                    <div className="space-y-2 opacity-60">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Studio Link (Email)</label>
                                        <div className="w-full bg-background/50 border border-border/50 rounded-2xl py-5 px-6 text-muted font-bold text-sm shadow-inner">
                                            {user?.email}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Direct Network (Phone)</label>
                                        <input
                                            type="tel"
                                            placeholder="+234..."
                                            className="w-full bg-background border border-border rounded-2xl py-5 px-6 text-foreground focus:outline-none focus:border-plaiz-blue focus:ring-4 focus:ring-plaiz-blue/5 transition-all font-bold text-sm shadow-sm"
                                            value={formData.phone}
                                            onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setHasChanges(true); }}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Professional Bio / Mission</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Elevate your presence..."
                                            className="w-full bg-background border border-border rounded-2xl py-5 px-6 text-foreground focus:outline-none focus:border-plaiz-blue focus:ring-4 focus:ring-plaiz-blue/5 transition-all font-bold text-sm resize-none shadow-sm"
                                            value={formData.bio}
                                            onChange={(e) => { setFormData({ ...formData, bio: e.target.value }); setHasChanges(true); }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Social Protocol</h5>
                                    <div className="flex items-center justify-between p-8 rounded-[32px] bg-background/50 border border-border shadow-lg">
                                        <div>
                                            <p className="text-sm font-black text-foreground mb-1">Preferred Communication</p>
                                            <p className="text-xs text-muted font-medium">How should the team synchronize with you?</p>
                                        </div>
                                        <select
                                            className="bg-surface border border-border rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-4 focus:ring-plaiz-blue/5"
                                            value={formData.preferred_comm_method}
                                            onChange={(e) => { setFormData({ ...formData, preferred_comm_method: e.target.value }); setHasChanges(true); }}
                                        >
                                            <option value="email">Email Terminal</option>
                                            <option value="whatsapp">WhatsApp Sync</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    disabled={!hasChanges || loading}
                                    className="w-full py-6 flex items-center justify-center gap-4 bg-foreground text-background rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:grayscale"
                                >
                                    <Save size={20} /> {loading ? 'Synchronizing...' : 'Update Node Identity'}
                                </button>
                            </div>
                        )}

                        {activeSection === 'account' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-surface border border-border rounded-[40px] p-8 md:p-12 space-y-10 shadow-xl">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                                            <Lock size={24} />
                                        </div>
                                        <h4 className="text-xl font-black text-foreground">Security</h4>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <PasswordInput
                                                label="New Password"
                                                placeholder="Minimum 8 characters"
                                                value={passwords.new}
                                                onChange={(val) => setPasswords({ ...passwords, new: val })}
                                                showStrength
                                            />
                                            <PasswordInput
                                                label="Confirm Password"
                                                value={passwords.confirm}
                                                onChange={(val) => setPasswords({ ...passwords, confirm: val })}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={!passwords.new || loading}
                                                className="px-8 py-4 rounded-2xl bg-plaiz-blue text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-plaiz-blue/20"
                                            >
                                                Update Password
                                            </button>
                                            <button
                                                onClick={() => signOut({ scope: 'global' })}
                                                className="px-8 py-4 rounded-2xl border border-border text-muted font-black text-xs uppercase tracking-widest hover:bg-background transition-all"
                                            >
                                                Logout from all sessions
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface border border-border rounded-[40px] p-8 md:p-12 space-y-8 shadow-xl">
                                    <div className="flex items-center gap-4 text-plaiz-coral">
                                        <div className="w-12 h-12 rounded-2xl bg-plaiz-coral/10 flex items-center justify-center">
                                            <AlertCircle size={24} />
                                        </div>
                                        <h4 className="text-xl font-black">Danger Zone</h4>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-plaiz-coral/5 border border-plaiz-coral/10">
                                        <div className="text-center md:text-left">
                                            <p className="text-foreground font-bold mb-1">Delete Account</p>
                                            <p className="text-muted text-xs font-medium max-w-sm">This will permanently deactivate your account and remove access to your dashboard.</p>
                                        </div>
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-plaiz-coral/20 text-plaiz-coral font-black text-[10px] uppercase tracking-widest border border-plaiz-coral/30 hover:bg-plaiz-coral hover:text-white transition-all shadow-lg shadow-plaiz-coral/5"
                                        >
                                            <Trash2 size={14} /> Deactivate Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'role' && isActiveWorker && (
                            <div className="bg-surface border border-border p-8 md:p-14 space-y-12 shadow-2xl rounded-[40px] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-[22px] bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue border border-plaiz-blue/20 shadow-sm">
                                        <Briefcase size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-foreground tracking-tight">Studio Engine Settings</h4>
                                        <p className="text-muted text-sm font-medium">Manage your professional flow within the grid.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Synchronization State (Availability)</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['available', 'busy', 'away'] as const).map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => { setWorkerData({ ...workerData, availability_status: status }); setHasChanges(true); }}
                                                    className={`py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest border transition-all
                                                        ${workerData.availability_status === status
                                                            ? 'bg-foreground text-background border-foreground shadow-xl'
                                                            : 'bg-background/50 border-border text-muted hover:text-foreground hover:border-muted'}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Specialist Minimum Price (NGN)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-border rounded-2xl py-5 px-6 text-foreground focus:outline-none focus:border-plaiz-blue focus:ring-4 focus:ring-plaiz-blue/5 transition-all font-bold text-sm shadow-sm"
                                            value={workerData.minimum_price || ''}
                                            placeholder="Minimum project price (e.g. 50000)"
                                            onChange={(e) => { setWorkerData({ ...workerData, minimum_price: e.target.value ? parseInt(e.target.value) : null }); setHasChanges(true); }}
                                        />
                                        <p className="text-[10px] text-muted font-medium mt-1">Nodes with no minimum price are skipped by auto-matching.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Max Project Parallelism</label>
                                        <input
                                            type="number"
                                            max={5}
                                            min={1}
                                            className="w-full bg-background border border-border rounded-2xl py-5 px-6 text-foreground focus:outline-none focus:border-plaiz-blue focus:ring-4 focus:ring-plaiz-blue/5 transition-all font-bold text-sm shadow-sm"
                                            value={workerData.max_projects_limit}
                                            onChange={(e) => { setWorkerData({ ...workerData, max_projects_limit: parseInt(e.target.value) }); setHasChanges(true); }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Creative Array (Skills & Tools)</label>
                                    <div className="flex flex-wrap gap-3">
                                        {WORKER_SPECIALIZATIONS.map((spec: any) => (
                                            <button
                                                key={spec.id}
                                                onClick={() => {
                                                    const exists = workerData.skills.includes(spec.id);
                                                    const newSkills = exists
                                                        ? workerData.skills.filter(s => s !== spec.id)
                                                        : [...workerData.skills, spec.id];
                                                    setWorkerData({ ...workerData, skills: newSkills });
                                                    setHasChanges(true);
                                                }}
                                                className={`px-5 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border transition-all
                                                    ${workerData.skills.includes(spec.id)
                                                        ? 'bg-plaiz-blue text-white border-plaiz-blue shadow-lg shadow-plaiz-blue/20'
                                                        : 'bg-background border-border text-muted hover:border-muted hover:text-foreground'}`}
                                            >
                                                {spec.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-8 rounded-[32px] bg-background/50 border border-border shadow-lg">
                                    <div>
                                        <p className="text-sm font-black text-foreground mb-1">Portfolio Grid Visibility</p>
                                        <p className="text-xs text-muted font-medium">Showcase your node within the global gallery</p>
                                    </div>
                                    <button
                                        onClick={() => { setWorkerData({ ...workerData, portfolio_visible: !workerData.portfolio_visible }); setHasChanges(true); }}
                                        className={`w-16 h-8 rounded-full transition-all relative border-2
                                            ${workerData.portfolio_visible ? 'bg-plaiz-blue border-plaiz-blue shadow-lg shadow-plaiz-blue/20' : 'bg-muted/20 border-border'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-background transition-all shadow-md
                                            ${workerData.portfolio_visible ? 'left-9' : 'left-1'}`} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleSaveWorkerStats}
                                    disabled={!hasChanges || loading}
                                    className="w-full py-6 bg-foreground text-background rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4"
                                >
                                    <Save size={20} /> {loading ? 'Synchronizing Engine...' : 'Commit Studio Config'}
                                </button>
                            </div>
                        )}

                        {activeSection === 'role' && role === 'client' && (
                            <div className="bg-surface border border-border p-8 md:p-14 space-y-12 shadow-2xl rounded-[40px] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-[22px] bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue border border-plaiz-blue/20 shadow-sm">
                                        <Zap size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-foreground tracking-tight">Project Flow Preferences</h4>
                                        <p className="text-muted text-sm font-medium">Customize your engagement within the studio.</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted px-1">Notification Protocol</h5>
                                    <div className="space-y-5">
                                        {[
                                            { id: 'project_updates', label: 'Cycle Updates', desc: 'Alerts for status transitions and phase progression' },
                                            { id: 'messages', label: 'Creative Feedback', desc: 'Real-time synchronization with project leads' },
                                            { id: 'marketing', label: 'System Inspiration', desc: 'Updates on studio trends and emerging architectures' }
                                        ].map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-8 rounded-[32px] bg-background/50 border border-border shadow-lg transition-all hover:border-plaiz-blue/20">
                                                <div>
                                                    <p className="text-sm font-black text-foreground mb-1">{item.label}</p>
                                                    <p className="text-xs text-muted font-medium">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newNotifs = { ...formData.notifications, [item.id]: !(formData.notifications as any)[item.id] };
                                                        setFormData({ ...formData, notifications: newNotifs });
                                                        setHasChanges(true);
                                                    }}
                                                    className={`w-16 h-8 rounded-full transition-all relative border-2
                                                        ${(formData.notifications as any)[item.id] ? 'bg-plaiz-blue border-plaiz-blue shadow-lg shadow-plaiz-blue/20' : 'bg-muted/20 border-border'}`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-background transition-all shadow-md
                                                        ${(formData.notifications as any)[item.id] ? 'left-9' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    disabled={!hasChanges || loading}
                                    className="w-full py-6 bg-foreground text-background rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4"
                                >
                                    <Save size={20} /> {loading ? 'Synchronizing...' : 'Commit Preferences'}
                                </button>
                            </div>
                        )}

                        {activeSection === 'admin' && role === 'admin' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-surface border border-border p-8 md:p-14 space-y-10 shadow-2xl rounded-[40px] transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-[22px] bg-plaiz-coral/10 flex items-center justify-center text-plaiz-coral border border-plaiz-coral/20 shadow-sm">
                                            <Sliders size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-foreground tracking-tight">System Configuration</h4>
                                            <p className="text-muted text-sm font-medium">Fine-tune the global creative grid parameters.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {adminSettings.map(setting => (
                                            <div key={setting.key} className="flex items-center justify-between p-8 rounded-[32px] bg-background/50 border border-border shadow-lg transition-all hover:border-plaiz-coral/20">
                                                <div className="flex-1 pr-10">
                                                    <p className="text-sm font-black text-foreground mb-1 capitalize">{setting.key.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-muted font-medium">{setting.description}</p>
                                                </div>
                                                {typeof setting.value === 'boolean' ? (
                                                    <button
                                                        onClick={() => updateAdminSetting(setting.key, !setting.value)}
                                                        className={`w-16 h-8 rounded-full transition-all relative border-2
                                                            ${setting.value ? 'bg-plaiz-coral border-plaiz-coral shadow-lg shadow-plaiz-coral/20' : 'bg-muted/20 border-border'}`}
                                                    >
                                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-background transition-all shadow-md
                                                            ${setting.value ? 'left-9' : 'left-1'}`} />
                                                    </button>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="w-24 bg-surface border border-border rounded-xl px-5 py-3 text-sm font-black text-foreground focus:outline-none focus:ring-4 focus:ring-plaiz-coral/5 transition-all"
                                                        value={setting.value}
                                                        onChange={(e) => updateAdminSetting(setting.key, parseInt(e.target.value))}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-surface border border-border p-10 shadow-xl relative overflow-hidden rounded-[40px] transition-all group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-plaiz-cyan/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                        <div className="flex items-center gap-4 text-muted mb-6 relative z-10">
                                            <div className="p-3 bg-background border border-border rounded-2xl shadow-sm"><Zap size={20} className="text-plaiz-cyan" /></div>
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Global Growth</h5>
                                        </div>
                                        <p className="text-5xl font-black text-foreground tracking-tighter relative z-10">{adminStats.totalUsers}</p>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-4 relative z-10">Active Neural Entities</p>
                                    </div>
                                    <div className="bg-surface border border-border p-10 shadow-xl relative overflow-hidden rounded-[40px] transition-all group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-plaiz-blue/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                        <div className="flex items-center gap-4 text-muted mb-6 relative z-10">
                                            <div className="p-3 bg-background border border-border rounded-2xl shadow-sm"><Globe size={20} className="text-plaiz-blue" /></div>
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Network Flux</h5>
                                        </div>
                                        <p className="text-5xl font-black text-foreground tracking-tighter relative z-10">{adminStats.activeProjects}</p>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-4 relative z-10">Synchronized Cycles</p>
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

export default SettingsTab;
