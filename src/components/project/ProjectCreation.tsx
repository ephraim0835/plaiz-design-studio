
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { Zap, Palette, Monitor, Printer, Loader2, Send, ArrowLeft } from 'lucide-react';

const SERVICE_TYPES = [
    { id: 'graphic_design', title: 'Graphic Design', icon: Palette, color: 'text-plaiz-blue', bg: 'bg-plaiz-blue/10' },
    { id: 'web_design', title: 'Web Design', icon: Monitor, color: 'text-plaiz-cyan', bg: 'bg-plaiz-cyan/10' },
    { id: 'printing', title: 'Printing Services', icon: Printer, color: 'text-plaiz-coral', bg: 'bg-plaiz-coral/10' }
];

import DashboardLayout from '../dashboard/DashboardLayout';

const ProjectCreation: React.FC = () => {
    const { user } = useAuth();
    const { createProject } = useProjects();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.brief) {
            setDescription(location.state.brief);
        }
    }, [location.state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) {
            setError('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const result = await createProject({
                title,
                description,
                project_type: 'pending' as any, // Rely on AI for detection
                client_id: user?.id,
                assignment_metadata: {
                    budget_ngn: 0, // Set to 0 since it will be negotiated later
                    created_via: 'new_format'
                }
            });

            if (result.success) {
                // The hook handles match_worker_to_project automatically
                // Navigate directly to Messages for immediate engagement
                navigate(`/client/messages?project=${result.data.id}`);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create project');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout title="Create Project">
            <div className="flex items-center justify-center relative py-10">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-0 left-0 flex items-center gap-2 text-muted hover:text-foreground transition-all font-black uppercase tracking-widest text-[10px] group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
                </button>
                <div className="w-full max-w-4xl bg-surface border border-border rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Right side: Instructions */}
                        <div className="p-10 lg:p-16 border-b lg:border-r border-[var(--border-color)] bg-plaiz-blue/5">
                            <div className="flex items-center gap-3 mb-12 text-plaiz-blue text-[10px] font-black uppercase tracking-[0.4em]">
                                <Zap size={16} className="fill-plaiz-blue" />
                                <span>AntiGravity AI</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter mb-12 leading-[0.9]">
                                Automated <br /> <span className="text-plaiz-blue">Orchestration.</span>
                            </h1>

                            <div className="space-y-8">
                                <div className="p-6 rounded-3xl bg-background border border-border flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-plaiz-blue/10 text-plaiz-blue flex items-center justify-center shrink-0">
                                        <Zap size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed">
                                        Our AI detects if you need Graphics, Web, or Printing instantly.
                                    </p>
                                </div>
                                <div className="p-6 rounded-3xl bg-background border border-border flex gap-4 opacity-60">
                                    <div className="w-10 h-10 rounded-xl bg-plaiz-coral/10 text-plaiz-coral flex items-center justify-center shrink-0">
                                        <Loader2 size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest leading-relaxed">
                                        Top-rated experts are matched based on availability and skill level.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right side: Details */}
                        <div className="p-10 lg:p-16 flex flex-col justify-center">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/30 ml-2">Project Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter project title..."
                                        className="w-full bg-background border border-border rounded-2xl p-5 text-lg font-bold text-foreground focus:border-plaiz-blue transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted/30 ml-2">Description</label>
                                    <textarea
                                        rows={6}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell us what you need..."
                                        className="w-full bg-background border border-border rounded-2xl p-5 text-base font-medium text-foreground/70 focus:border-plaiz-blue transition-all outline-none resize-none"
                                    />
                                </div>

                                {error && <p className="text-plaiz-coral text-xs font-bold uppercase tracking-widest text-center">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-6 bg-plaiz-blue text-white rounded-[24px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    {submitting ? 'Initializing...' : 'Launch Project'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProjectCreation;
