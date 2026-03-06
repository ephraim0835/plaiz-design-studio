import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Image as ImageIcon, AlertCircle, X, Eye, EyeOff, Star, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Admin = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio', 'testimonials', 'security'
    const [securityData, setSecurityData] = useState({ failedLogins: 0, failedAPI: 0, uploads: [] });
    const [headerStatus, setHeaderStatus] = useState({ csp: "Checking...", xFrameOptions: "Checking...", xContentTypeOptions: "Checking..." });

    const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'plaiz_dev_sec_2026';
    const TEST_ACCESS_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'plaiz_studio_2026';

    // Testimonials state
    const [testimonials, setTestimonials] = useState([]);
    const [tSaving, setTSaving] = useState(false);
    const [tStatus, setTStatus] = useState('');

    const categories = ['Logos', 'Branding', 'Flyers', 'Packaging', 'Social Media Post', 'Cards', 'Mockups'];

    useEffect(() => {
        const loadAllData = async () => {
            try {
                // Fetch from Supabase instead of local API
                const [portRes, testRes] = await Promise.all([
                    supabase.from('portfolio').select('*').order('id', { ascending: false }),
                    supabase.from('testimonials').select('*').order('id', { ascending: false })
                ]);

                if (portRes.error) throw portRes.error;
                if (testRes.error) throw testRes.error;

                setProjects(portRes.data || []);
                setTestimonials(testRes.data || []);

                // Fetch security metrics from Supabase
                const { data: logs, error: logsError } = await supabase
                    .from('security_logs')
                    .select('*')
                    .order('timestamp', { ascending: false });

                if (!logsError && logs) {
                    const failedLogins = logs.filter(l => l.type === 'login_fail').length;
                    const failedAPI = logs.filter(l => l.type === 'api_fail').length;
                    const uploads = logs.filter(l => l.type.startsWith('upload_')).map(l => ({
                        filename: l.details?.filename || 'unknown',
                        status: l.type === 'upload_accept' ? 'accepted' : 'rejected',
                        date: l.timestamp
                    }));
                    setSecurityData({ failedLogins, failedAPI, uploads });
                }

                // Header status check (simplified for cloud)
                // In production, we assume Vercel provides these if vercel.json is set correctly.
                // We'll try to fetch the headers of the current page as a proxy.
                try {
                    const response = await fetch(window.location.origin, { method: 'HEAD' });
                    setHeaderStatus({
                        csp: response.headers.get('content-security-policy') ? '✔️ OK' : '❌ Missing',
                        xFrameOptions: response.headers.get('x-frame-options') ? '✔️ OK' : '❌ Missing',
                        xContentTypeOptions: response.headers.get('x-content-type-options') ? '✔️ OK' : '❌ Missing'
                    });
                } catch (hErr) {
                    console.warn('Could not verify headers automatically');
                }

            } catch (err) {
                console.error('Error loading admin data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    const handleAdd = () => {
        const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
        setProjects([{
            id: newId,
            title: 'New Project',
            category: 'Branding',
            description: '',
            image: '',
            images: []
        }, ...projects]);
    };

    const handleRemove = (id) => {
        if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            setProjects(projects.filter(p => p.id !== id));
        }
    };

    const handleChange = (id, field, value) => {
        setProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleImageUpload = (id, files) => {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProjects(prevProjects => prevProjects.map(p => {
                    if (p.id === id) {
                        // Store File objects for Supabase upload + base64 for preview
                        const newFiles = p.newFiles ? [...p.newFiles, file] : [file];
                        const previewImages = p.previewImages ? [...p.previewImages, reader.result] : [reader.result];

                        let coverImage = p.image;
                        if (!coverImage && previewImages.length === 1 && (!p.images || p.images.length === 0)) {
                            coverImage = reader.result;
                        }

                        return { ...p, newFiles, previewImages, image: coverImage };
                    }
                    return p;
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemoveImage = (id, indexToRemove, isPreview) => {
        setProjects(projects.map(p => {
            if (p.id === id) {
                if (isPreview) {
                    const newPreviews = p.previewImages.filter((_, idx) => idx !== indexToRemove);
                    const newFiles = p.newFiles?.filter((_, idx) => idx !== indexToRemove) || [];

                    // Update cover if the first preview was the cover and it's removed
                    let coverImage = p.image;
                    if (p.previewImages[indexToRemove] === coverImage) {
                        coverImage = p.images?.length > 0 ? p.images[0] : (newPreviews.length > 0 ? newPreviews[0] : '');
                    }

                    return { ...p, previewImages: newPreviews, newFiles: newFiles, image: coverImage };
                } else {
                    const newSavedImages = p.images.filter((_, idx) => idx !== indexToRemove);
                    // If we deleted the primary cover image, we should try to assign a new one
                    let coverImage = p.image;
                    if (p.images[indexToRemove] === coverImage) {
                        coverImage = newSavedImages.length > 0 ? newSavedImages[0] : (p.previewImages?.length > 0 ? p.previewImages[0] : '');
                    }
                    return { ...p, images: newSavedImages, image: coverImage };
                }
            }
            return p;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatusText('Saving Projects...');
        try {
            const sanitize = (str) => typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : str;

            const updatedProjects = await Promise.all(projects.map(async (project) => {
                let currentImages = [...(project.images || [])];
                let currentCover = project.image;

                // Upload new files to Supabase Storage
                if (project.newFiles && project.newFiles.length > 0) {
                    for (const file of project.newFiles) {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                        const filePath = `project-images/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('portfolio-assets')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('portfolio-assets')
                            .getPublicUrl(filePath);

                        currentImages.push(publicUrl);

                        // Log successful upload to security trail
                        await supabase.from('security_logs').insert([{
                            type: 'upload_accept',
                            details: { filename: file.name, path: filePath }
                        }]);
                        // If currentCover is still a base64 from a preview, update it to the public URL
                        if (currentCover?.startsWith('data:')) {
                            currentCover = publicUrl;
                        }
                    }
                }

                // If no cover is set but we have images, pick the first one
                if (!currentCover && currentImages.length > 0) {
                    currentCover = currentImages[0];
                }

                const { previewImages, newFiles, newImages, ...cleanProject } = project;
                return {
                    ...cleanProject,
                    title: sanitize(project.title),
                    description: sanitize(project.description),
                    images: currentImages,
                    image: currentCover
                };
            }));

            // Upsert all data to Supabase
            const { error } = await supabase
                .from('portfolio')
                .upsert(updatedProjects);

            if (error) throw error;

            setStatusText('Saved successfully!');
            // Reload from source to be safe
            const { data } = await supabase.from('portfolio').select('*').order('id', { ascending: false });
            setProjects(data || []);

        } catch (err) {
            console.error(err);
            setStatusText('Error saving: ' + (err.message || 'Unknown error'));
        }
        setSaving(false);
        setTimeout(() => setStatusText(''), 3000);
    };

    const handleTSave = async () => {
        setTSaving(true);
        setTStatus('Saving Testimonials...');
        try {
            const { error } = await supabase
                .from('testimonials')
                .upsert(testimonials);

            if (error) throw error;

            setTStatus('Saved successfully!');
            const { data } = await supabase.from('testimonials').select('*').order('id', { ascending: false });
            setTestimonials(data || []);
        } catch (err) {
            console.error(err);
            setTStatus('Error: ' + err.message);
        }
        setTSaving(false);
        setTimeout(() => setTStatus(''), 3000);
    };

    if (!import.meta.env.DEV) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Dashboard Unavailable</h1>
                    <p className="text-slate-400">The admin dashboard is only accessible in local development mode.</p>
                </div>
            </div>
        );
    }

    if (loading) return <div className="min-h-screen pt-32 text-center text-white">Loading Dashboard...</div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-[#0F172A] border border-white/10 p-8 rounded-3xl shadow-2xl"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-plaiz/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-plaiz/30">
                            <Save size={32} className="text-plaiz" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Admin Access</h2>
                        <p className="text-slate-400 mt-2">Enter your password to manage the studio.</p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (password === TEST_ACCESS_PASS) {
                                setIsAuthenticated(true);
                            } else {
                                setLoginError('Incorrect password. Please try again.');
                                // Report failed login to Supabase
                                supabase.from('security_logs').insert([{
                                    type: 'login_fail',
                                    details: { ip: 'client-side-vibe' }
                                }]).then(() => { });
                            }
                        }}
                        className="space-y-6"
                    >
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (loginError) setLoginError('');
                                }}
                                className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-plaiz transition-colors"
                                placeholder="Enter Access Password"
                                autoFocus
                            />
                            {loginError && <p className="text-red-400 text-xs mt-2">{loginError}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-plaiz hover:bg-plaiz-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-plaiz/20"
                        >
                            Log In
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[#020617]">
            <div className="max-w-5xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Studio Dashboard</h1>
                        <p className="text-slate-400">Manage your portfolio, testimonials, and security.</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
                    {['portfolio', 'testimonials', 'security'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl font-medium transition-all capitalize ${activeTab === tab
                                ? 'bg-plaiz text-white shadow-lg shadow-plaiz/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'portfolio' && (
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Portfolio Projects</h2>
                                <p className="text-slate-400">Add, edit, or remove your featured work.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleAdd}
                                    className="flex items-center gap-2 bg-[#0F172A] border border-white/10 hover:border-white/30 text-white px-5 py-2.5 rounded-xl transition-all font-medium text-sm"
                                >
                                    <Plus size={18} /> Add Project
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-plaiz hover:bg-plaiz-hover text-white px-6 py-2.5 rounded-xl transition-all font-medium text-sm shadow-lg shadow-plaiz/20 disabled:opacity-50"
                                >
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {projects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#0F172A] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-8 relative group"
                                >
                                    <button
                                        onClick={() => handleRemove(project.id)}
                                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400 bg-black/20 p-2 rounded-lg opacity-100 transition-all z-10"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    {/* Image Uploader */}
                                    <div className="w-full md:w-1/3 shrink-0">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            {project.images && project.images.map((imgUrl, idx) => (
                                                <div key={`saved-${idx}`} className={`relative group/thumb border rounded-xl overflow-hidden aspect-square bg-[#020617] ${project.image === imgUrl ? 'border-plaiz ring-1 ring-plaiz' : 'border-white/10'}`}>
                                                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => handleRemoveImage(project.id, idx, false)}
                                                        className="absolute top-1 right-1 bg-red-500/80 text-white w-6 h-6 rounded-md opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="relative aspect-square rounded-xl overflow-hidden bg-[#020617] border-2 border-dashed border-white/10 hover:border-plaiz/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-slate-500 hover:text-plaiz">
                                                <Plus size={24} />
                                                <input type="file" multiple className="hidden" onChange={(e) => handleImageUpload(project.id, e.target.files)} />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="w-full space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                value={project.title}
                                                onChange={(e) => handleChange(project.id, 'title', e.target.value)}
                                                className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-plaiz outline-none"
                                                placeholder="Project Title"
                                            />
                                            <select
                                                value={project.category}
                                                onChange={(e) => handleChange(project.id, 'category', e.target.value)}
                                                className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-plaiz outline-none"
                                            >
                                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <textarea
                                            value={project.description || ''}
                                            onChange={(e) => handleChange(project.id, 'description', e.target.value)}
                                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-plaiz outline-none h-24 resize-none"
                                            placeholder="Description"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'testimonials' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Client Testimonials</h2>
                                <p className="text-slate-400">Manage feedback from your clients.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        const newId = Date.now();
                                        setTestimonials([{ id: newId, name: '', role: '', review: '', stars: 5, published: true }, ...testimonials]);
                                    }}
                                    className="flex items-center gap-2 bg-[#0F172A] border border-white/10 hover:border-white/30 text-white px-5 py-2.5 rounded-xl transition-all font-medium text-sm"
                                >
                                    <Plus size={18} /> Add Testimonial
                                </button>
                                <button
                                    onClick={handleTSave}
                                    disabled={tSaving}
                                    className="flex items-center gap-2 bg-plaiz hover:bg-plaiz-hover text-white px-6 py-2.5 rounded-xl transition-all font-medium text-sm shadow-lg shadow-plaiz/20 disabled:opacity-50"
                                >
                                    <Save size={18} /> {tSaving ? 'Saving...' : 'Save Testimonials'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {testimonials.map((t) => (
                                <motion.div key={t.id} className="bg-[#0F172A] border border-white/10 rounded-2xl p-6 relative">
                                    <button
                                        onClick={() => setTestimonials(testimonials.filter(x => x.id !== t.id))}
                                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input
                                            value={t.name}
                                            onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))}
                                            className="bg-[#020617] border border-white/10 rounded-xl px-4 py-2 text-white"
                                            placeholder="Name"
                                        />
                                        <input
                                            value={t.role}
                                            onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, role: e.target.value } : x))}
                                            className="bg-[#020617] border border-white/10 rounded-xl px-4 py-2 text-white"
                                            placeholder="Role"
                                        />
                                    </div>
                                    <textarea
                                        value={t.review}
                                        onChange={e => setTestimonials(testimonials.map(x => x.id === t.id ? { ...x, review: e.target.value } : x))}
                                        className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-2 text-white h-24 resize-none"
                                        placeholder="Review"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[#0F172A] border border-white/10 p-6 rounded-3xl">
                                <p className="text-slate-400 text-sm mb-1">Failed Logins</p>
                                <p className="text-3xl font-bold text-red-400">{securityData.failedLogins}</p>
                            </div>
                            <div className="bg-[#0F172A] border border-white/10 p-6 rounded-3xl">
                                <p className="text-slate-400 text-sm mb-1">Unauthorized API</p>
                                <p className="text-3xl font-bold text-orange-400">{securityData.failedAPI}</p>
                            </div>
                            <div className="bg-[#0F172A] border border-white/10 p-6 rounded-3xl col-span-1 md:col-span-2">
                                <p className="text-slate-400 text-sm mb-2">Security Headers</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">CSP:</span>
                                        <span className={`${headerStatus.csp?.includes('✔️') ? 'text-green-400' : 'text-red-400'} font-mono`}>{headerStatus.csp}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">Frame Protection:</span>
                                        <span className={`${headerStatus.xFrameOptions?.includes('✔️') ? 'text-green-400' : 'text-red-400'} font-mono`}>{headerStatus.xFrameOptions}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">MIME Sniffing:</span>
                                        <span className={`${headerStatus.xContentTypeOptions?.includes('✔️') ? 'text-green-400' : 'text-red-400'} font-mono`}>{headerStatus.xContentTypeOptions}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Recent Upload Activity</h2>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {securityData.uploads.length === 0 ? (
                                    <p className="text-slate-500 italic">No recent events logged.</p>
                                ) : (
                                    securityData.uploads.map((log, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-[#020617] border border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${log.type === 'upload_accept' ? 'bg-green-400' : 'bg-red-400'}`} />
                                                <div>
                                                    <p className="text-white text-sm font-medium">{log.filename || log.reason}</p>
                                                    <p className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleString()} • {log.size || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded-full ${log.type === 'upload_accept' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                                                {log.type === 'upload_accept' ? 'Accepted' : 'Rejected'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
