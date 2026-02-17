import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Image as ImageIcon, Upload, Check, X, Star, Filter, Heart, Plus, Trash2, Camera, AlertCircle } from 'lucide-react';
import { PortfolioItem } from '../../types';

const GalleryTab = () => {
    const { profile, role } = useAuth();
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Upload Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const isWorker = ['graphic_designer', 'web_designer', 'designer', 'developer', 'print_specialist', 'video_editor', 'worker'].includes(role || '');
    const isAdmin = role === 'admin';

    // Map role to allowed service_type
    const getWorkerCategory = () => {
        if (role === 'graphic_designer') return 'graphics';
        if (role === 'web_designer') return 'web';
        if (role === 'print_specialist') return 'printing';
        return profile?.skill || '';
    };

    const fetchGallery = async () => {
        setLoading(true);
        try {
            // Join with profiles to get attribution
            let query = supabase.from('portfolio').select(`
                *,
                profiles:worker_id (
                    full_name
                )
            `);


            // Everyone can see all approved items (all items are auto-approved)
            query = query.eq('is_approved', true);

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            console.error('Error fetching gallery:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();

        // Auto-set category for workers
        if (isWorker && !isAdmin) {
            setNewCategory(getWorkerCategory());
        }
    }, [role, profile?.id]);

    // Real-time update subscription
    useEffect(() => {
        const subscription = supabase
            .channel('portfolio-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio' }, () => {
                fetchGallery()
            })
            .subscribe()

        return () => { subscription.unsubscribe() }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            const filtered = prev.filter((_, i) => i !== index);
            // Revoke URL to prevent memory leaks
            URL.revokeObjectURL(prev[index]);
            return filtered;
        });
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0 || !newTitle || !newCategory) return;

        setUploading(true);
        try {
            const uploadPromises = selectedFiles.map(async (file) => {
                // 1. Upload to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `portfolio/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('projects')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('projects')
                    .getPublicUrl(filePath);

                // 2. Insert into portfolio table
                const { error: insertError } = await supabase
                    .from('portfolio')
                    .insert({
                        worker_id: profile?.id,
                        title: newTitle,
                        description: newDescription,
                        image_url: publicUrl,
                        service_type: newCategory,
                        is_approved: true, // Auto-approve all uploads
                        uploaded_by_role: role
                    });

                if (insertError) throw insertError;
            });

            await Promise.all(uploadPromises);

            // Success!
            setIsModalOpen(false);
            setNewTitle('');
            setNewDescription('');
            setSelectedFiles([]);
            setPreviewUrls([]);
            fetchGallery();
            alert("Added to portfolio!");
        } catch (err: any) {
            console.error('Upload error:', err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this portfolio item?')) return;

        try {
            const { error } = await supabase
                .from('portfolio')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err: any) {
            console.error('Delete error:', err);
            alert(`Delete failed: ${err.message}`);
        }
    };

    const handleApproval = async (id: string, approved: boolean) => {
        // Optimistic UI Update
        const previousItems = [...items];
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, is_approved: approved } : item
        ));

        try {
            const { error } = await supabase
                .from('portfolio')
                .update({ is_approved: approved })
                .eq('id', id);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating approval:', err);
            setItems(previousItems);
            alert(`Action failed: ${err.message}`);
        }
    };

    const handleToggleFeatured = async (id: string, featured: boolean) => {
        // Optimistic UI Update
        const previousItems = [...items];
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, is_featured: featured } : item
        ));

        try {
            const { error } = await supabase
                .from('portfolio')
                .update({ is_featured: featured })
                .eq('id', id);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating featured status:', err);
            setItems(previousItems);
            alert(`Action failed: ${err.message}`);
        }
    };

    return (
        <DashboardLayout title="Gallery">
            {/* Upload Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-surface border border-white/10 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden p-8 lg:p-10 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-white px-2">Submit New Work</h3>
                                <p className="text-white/40 text-sm font-medium px-2">Build your professional portfolio</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Image Upload Area */}
                            <div className="space-y-4">
                                <div
                                    onClick={() => document.getElementById('portfolio-file')?.click()}
                                    className="aspect-video rounded-[32px] border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-plaiz-blue/50 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group min-h-[200px]"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue mb-4">
                                        <Plus size={32} />
                                    </div>
                                    <p className="text-white font-bold">Add files to portfolio</p>
                                    <p className="text-white/40 text-xs mt-1">PNG, JPG or WEBP (Max 5MB each)</p>
                                    <input id="portfolio-file" type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                                </div>

                                {previewUrls.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previewUrls.map((url, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-black/20">
                                                <img src={url} className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                                        className="p-1.5 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Project Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="e.g. Modern Brand Identity"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:border-plaiz-blue/50 focus:ring-4 focus:ring-plaiz-blue/10 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Category</label>
                                    <select
                                        required
                                        disabled={isWorker && !isAdmin}
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:border-plaiz-blue/50 transition-all outline-none disabled:opacity-50"
                                    >
                                        <option value="" disabled className="bg-surface">Select Category</option>
                                        <option value="graphics" className="bg-surface">Graphic Design</option>
                                        <option value="web" className="bg-surface">Web Design</option>
                                        <option value="printing" className="bg-surface">Printing</option>
                                    </select>
                                    {isWorker && !isAdmin && (
                                        <p className="text-[9px] text-plaiz-cyan font-bold uppercase tracking-widest px-2 mt-1 flex items-center gap-1">
                                            <AlertCircle size={10} /> Auto-assigned to your skill
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Description</label>
                                <textarea
                                    rows={3}
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="Briefly describe this work..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:border-plaiz-blue/50 transition-all outline-none resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || selectedFiles.length === 0}
                                className="w-full py-5 bg-plaiz-blue text-white rounded-[24px] font-black text-lg shadow-xl shadow-plaiz-blue/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shrink-0"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={24} /> Submit to Portfolio
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-10 animate-fade-in pb-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Studio Gallery</h2>
                        <p className="text-white/40 font-medium italic text-sm lg:text-base">Showcasing excellence and brand consistency</p>
                    </div>
                    {isWorker && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary flex items-center gap-2 group"
                        >
                            <Upload size={18} className="group-hover:rotate-12 transition-transform" /> Submit Work
                        </button>
                    )}
                </div>

                {/* Categories / Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="p-5 lg:p-6 rounded-[24px] lg:rounded-[28px] bg-white/5 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 lg:gap-4 mb-2">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-plaiz-cyan/10 flex items-center justify-center text-plaiz-cyan">
                                <ImageIcon size={18} />
                            </div>
                            <h4 className="text-white font-black text-[10px] lg:text-sm uppercase tracking-widest">Total Assets</h4>
                        </div>
                        <p className="text-2xl lg:text-3xl font-black text-white">{items.length}</p>
                    </div>
                    <div className="p-5 lg:p-6 rounded-[24px] lg:rounded-[28px] bg-white/5 border border-white/5 backdrop-blur-sm shadow-xl">
                        <div className="flex items-center gap-3 lg:gap-4 mb-2">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                                <Star size={18} />
                            </div>
                            <h4 className="text-white font-black text-[10px] lg:text-sm uppercase tracking-widest">Featured</h4>
                        </div>
                        <p className="text-2xl lg:text-3xl font-black text-white">{items.filter(i => i.is_featured).length}</p>
                    </div>
                    <div className="p-5 lg:p-6 rounded-[24px] lg:rounded-[28px] bg-white/5 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 lg:gap-4 mb-2">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-plaiz-coral/10 flex items-center justify-center text-plaiz-coral">
                                <Filter size={18} />
                            </div>
                            <h4 className="text-white font-black text-[10px] lg:text-sm uppercase tracking-widest">Latest Update</h4>
                        </div>
                        <p className="text-2xl lg:text-3xl font-black text-white">Today</p>
                    </div>
                </div>

                {/* Gallery Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="aspect-square rounded-[24px] lg:rounded-[32px] bg-white/5 animate-pulse" />)}
                    </div>
                ) : items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map(item => (
                            <div key={item.id} className="group relative aspect-square rounded-[24px] lg:rounded-[32px] overflow-hidden bg-white/5 border border-white/5 hover:border-plaiz-cyan/30 transition-all shadow-lg overflow-hidden">
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                    <h5 className="text-white font-black text-lg mb-1">{item.title}</h5>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            {item.is_featured && (
                                                <span className="px-2 py-0.5 rounded bg-plaiz-cyan/20 text-plaiz-cyan text-[8px] font-black uppercase tracking-widest border border-plaiz-cyan/30">Featured</span>
                                            )}
                                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{item.service_type}</span>
                                        </div>
                                        {item.profiles && (
                                            <p className="text-plaiz-cyan text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Star size={10} fill="currentColor" /> Created by {item.profiles.full_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Controls Overlay */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleToggleFeatured(item.id, !item.is_featured)}
                                            className={`p-2 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-transform
                                                ${item.is_featured ? 'bg-plaiz-cyan text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            title={item.is_featured ? "Remove from Featured" : "Feature Item"}
                                        >
                                            <Star size={16} fill={item.is_featured ? "currentColor" : "none"} />
                                        </button>
                                    )}
                                    {(isAdmin || (isWorker && item.worker_id === profile?.id)) && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-transform"
                                            title="Delete permanently"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Status Badge (Pending) */}
                                {!item.is_approved && (role === 'admin' || isWorker) && (
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 rounded-full bg-plaiz-coral text-white text-[9px] font-black uppercase tracking-widest shadow-xl">Pending Review</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-white/5 bg-white/[0.02]">
                        <div className="w-20 h-20 rounded-[30px] bg-white/5 flex items-center justify-center mb-6 text-white/10">
                            <ImageIcon size={40} />
                        </div>
                        <h4 className="text-white font-black text-xl mb-2">The gallery is empty</h4>
                        <p className="text-white/30 text-sm font-medium">Completed projects will appear here once approved.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default GalleryTab;
