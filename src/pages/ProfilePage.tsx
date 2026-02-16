import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Camera, Save, Loader2, Check, User, Mail, Phone, Briefcase, AlertCircle, Sparkles } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PortfolioGrid from '../components/portfolio/PortfolioGrid';

const ProfilePage: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize form with User Metadata preferred, falling back to Profile table
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        bio: '',
        skills: [] as string[]
    });

    useEffect(() => {
        // Priority: Auth Metadata > Profile Table > Empty
        if (user || profile) {
            setFormData({
                full_name: user?.user_metadata?.full_name || profile?.full_name || '',
                phone_number: user?.user_metadata?.phone_number || profile?.phone || '',
                bio: profile?.bio || '',
                skills: profile?.skills || []
            });
        }
    }, [user, profile]);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validation
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be less than 2MB');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setError('Only JPG or PNG images are allowed');
            return;
        }

        try {
            setUploadingAvatar(true);
            setError(null);

            // 1. Compress
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);

            // 2. Upload to Storage: profiles/{userId}/profile.jpg
            const filePath = `profiles/${user.id}/profile.jpg`;

            // Force cache bust by adding timestamp to url only, but overwrite same file
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, compressedFile, { upsert: true });

            if (uploadError) throw uploadError;

            // 3. Get Public URL with timestamp to bust browser cache
            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

            // 4. Update Auth Metadata (Vital for Context Refresh)
            const { error: authError } = await supabase.auth.updateUser({
                data: { profile_picture: publicUrlWithTimestamp }
            });
            if (authError) throw authError;

            // 5. Update Database Table
            const { error: dbError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrlWithTimestamp })
                .eq('id', user.id);

            if (dbError) throw dbError;

            // 6. Refresh Context
            await refreshProfile();
            // Also force a hard refresh of the session if needed, mostly handled by auth listener
            // window.location.reload(); // Optional, but usually not needed if context updates

            showSuccess('Profile picture updated!');
        } catch (err: any) {
            console.error('Avatar upload failed:', err);
            setError(err.message || 'Failed to update profile picture');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSaving(true);
            setError(null);

            // 1. Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    phone_number: formData.phone_number
                }
            });
            if (authError) throw authError;

            // 2. Update Profiles Database
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone_number,
                    bio: formData.bio,
                    skills: formData.skills
                })
                .eq('id', user.id);

            if (dbError) throw dbError;

            showSuccess('Profile information saved!');
            await refreshProfile();

        } catch (err: any) {
            console.error('Profile update failed:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const isWorker = ['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'video_editor', 'print_specialist']
        .includes(profile?.role as any);

    // Get avatar from Auth Metadata first (fastest), then Profile Table
    const displayAvatar = user?.user_metadata?.profile_picture || profile?.avatar_url;

    return (
        <DashboardLayout title="My Profile">
            <div className="max-w-2xl mx-auto pb-24 md:pb-12 animate-fade-in">

                {/* Mobile-First Feedback Toasts */}
                {success && (
                    <div className="fixed top-24 right-6 left-6 md:left-auto md:w-96 z-50 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Check size={16} className="text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold text-emerald-400">{success}</p>
                    </div>
                )}
                {error && (
                    <div className="fixed top-24 right-6 left-6 md:left-auto md:w-96 z-50 bg-red-500/10 border border-red-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <AlertCircle size={16} className="text-red-400" />
                        </div>
                        <p className="text-sm font-bold text-red-400">{error}</p>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-surface border border-border rounded-[32px] overflow-hidden backdrop-blur-xl relative">

                    {/* Artistic Header Background */}
                    <div className="h-32 bg-gradient-to-r from-plaiz-blue/20 via-purple-500/10 to-plaiz-cyan/20 border-b border-border" />

                    <div className="px-6 md:px-10 -mt-16 pb-10">

                        {/* Avatar Upload Selection */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-[6px] border-background shadow-2xl overflow-hidden bg-background relative">
                                    {displayAvatar ? (
                                        <img
                                            src={displayAvatar}
                                            alt="Profile"
                                            className="w-full h-full object-cover transition-opacity duration-300"
                                            key={displayAvatar} // Force re-render on url change
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-black text-4xl">
                                            {formData.full_name?.charAt(0) || 'U'}
                                        </div>
                                    )}

                                    {/* Loading Overlay */}
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                            <Loader2 size={32} className="text-white animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Floating Camera Button */}
                                <label className="absolute bottom-1 right-1 p-3 bg-plaiz-blue text-white rounded-full cursor-pointer shadow-xl hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all border-4 border-background z-10">
                                    <Camera size={18} />
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleAvatarUpload}
                                        disabled={uploadingAvatar}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div className="mt-4 text-center">
                                <h2 className="text-2xl font-black text-foreground">{formData.full_name || 'User Profile'}</h2>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="px-3 py-1 bg-surface border border-border rounded-full text-[10px] font-bold uppercase tracking-widest text-muted">
                                        {profile?.role?.replace('_', ' ') || 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Edit Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1 flex items-center gap-2">
                                        <User size={12} /> Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-background border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted/20 focus:border-plaiz-cyan/50 focus:bg-surface focus:outline-none transition-all font-medium"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1 flex items-center gap-2">
                                        <Phone size={12} /> Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="w-full bg-background border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted/20 focus:border-plaiz-cyan/50 focus:bg-surface focus:outline-none transition-all font-medium"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>

                                {/* Read-Only Email */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1 flex items-center gap-2">
                                        <Mail size={12} /> Email
                                    </label>
                                    <div className="w-full bg-background border border-border rounded-2xl py-4 px-5 text-muted cursor-not-allowed font-medium select-none truncate">
                                        {user?.email}
                                    </div>
                                </div>

                                {/* Read-Only Role */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1 flex items-center gap-2">
                                        <Briefcase size={12} /> Account
                                    </label>
                                    <div className="w-full bg-background border border-border rounded-2xl py-4 px-5 text-muted font-medium capitalize flex items-center justify-between">
                                        {profile?.role?.replace('_', ' ')}
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1">About</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={4}
                                    className="w-full bg-background border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted/20 focus:border-plaiz-cyan/50 focus:bg-surface focus:outline-none transition-all font-medium resize-none leading-relaxed"
                                    placeholder="Tell us a bit about yourself..."
                                />
                            </div>

                            {/* Worker Skills */}
                            {isWorker && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-1">Skills (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.skills.join(', ')}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                        })}
                                        className="w-full bg-background border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted/20 focus:border-plaiz-cyan/50 focus:bg-surface focus:outline-none transition-all font-medium"
                                        placeholder="e.g. Photoshop, React, Figma"
                                    />
                                </div>
                            )}

                            <div className="pt-4 pb-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 bg-plaiz-blue text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-plaiz-blue/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} className="group-hover:scale-110 transition-transform" />
                                            Update Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Worker Portfolio Section */}
                {isWorker && (
                    <div className="mt-12 animate-fade-in-up">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div>
                                <h3 className="text-2xl font-black text-foreground">My Portfolio</h3>
                                <p className="text-muted text-sm">Projects you've showcased to clients</p>
                            </div>
                            <div className="p-3 bg-plaiz-blue/10 rounded-2xl">
                                <Sparkles className="text-plaiz-blue" size={24} />
                            </div>
                        </div>

                        <WorkerPortfolio workerId={user?.id} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

// Sub-component for worker's own portfolio
const WorkerPortfolio = ({ workerId }: { workerId?: string }) => {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!workerId) return;

        const fetchMyWork = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('portfolio')
                    .select('*')
                    .eq('worker_id', workerId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setItems(data || []);
            } catch (err) {
                console.error('Error fetching worker portfolio:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyWork();
    }, [workerId]);

    return <PortfolioGrid items={items} loading={loading} />;
};

export default ProfilePage;
