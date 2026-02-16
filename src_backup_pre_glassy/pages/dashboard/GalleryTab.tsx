import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Image as ImageIcon, Upload, Check, X, Star, Filter, Heart } from 'lucide-react';
import { GalleryItem } from '../../types';

const GalleryTab = () => {
    const { profile, role } = useAuth();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const isWorker = role === 'graphic_designer' || role === 'web_designer';

    const fetchGallery = async () => {
        setLoading(true);
        try {
            let query = supabase.from('gallery_items').select('*');

            // Non-admins only see approved items, or their own pending items
            if (role !== 'admin') {
                if (isWorker) {
                    query = query.or(`is_approved.eq.true,worker_id.eq.${profile?.id}`);
                } else {
                    query = query.eq('is_approved', true);
                }
            }

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
    }, [role, profile?.id]);

    // Real-time update subscription for instant reflection
    useEffect(() => {
        const subscription = supabase
            .channel('gallery-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_items' }, () => {
                fetchGallery()
            })
            .subscribe()

        return () => { subscription.unsubscribe() }
    }, [])

    const handleApproval = async (id: string, approved: boolean) => {
        // Optimistic UI Update
        const previousItems = [...items];
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, is_approved: approved } : item
        ));

        try {
            const { error } = await supabase
                .from('gallery_items')
                .update({ is_approved: approved })
                .eq('id', id);

            if (error) throw error;
            // No need to fetch, subscription will handle, or just keep optimistic
        } catch (err: any) {
            console.error('Error updating approval:', err);
            // Rollback on error
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
                .from('gallery_items')
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
            <div className="space-y-10 animate-fade-in pb-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Studio Gallery</h2>
                        <p className="text-white/40 font-medium italic text-sm lg:text-base">Showcasing excellence and brand consistency</p>
                    </div>
                    {isWorker && (
                        <button className="btn-primary flex items-center gap-2">
                            <Upload size={18} /> Submit Work
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
                                    <div className="flex items-center gap-2">
                                        {item.is_featured && (
                                            <span className="px-2 py-0.5 rounded bg-plaiz-cyan/20 text-plaiz-cyan text-[8px] font-black uppercase tracking-widest border border-plaiz-cyan/30">Featured</span>
                                        )}
                                        <span className="text-white/40 text-[9px] font-bold">Project #{item.project_id.slice(0, 8)}</span>
                                    </div>
                                </div>

                                {/* Admin Controls Overlay */}
                                {role === 'admin' && (
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!item.is_approved ? (
                                            <button
                                                onClick={() => handleApproval(item.id, true)}
                                                className="p-2 bg-green-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-transform"
                                                title="Approve"
                                            >
                                                <Check size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApproval(item.id, false)}
                                                className="p-2 bg-plaiz-coral text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-transform"
                                                title="Reject/Hide"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleToggleFeatured(item.id, !item.is_featured)}
                                            className={`p-2 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-transform
                                                ${item.is_featured ? 'bg-plaiz-cyan text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                            title={item.is_featured ? "Remove from Featured" : "Feature Item"}
                                        >
                                            <Star size={16} fill={item.is_featured ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                )}

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
