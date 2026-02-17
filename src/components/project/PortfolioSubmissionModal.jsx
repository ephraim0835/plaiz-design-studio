import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Sparkles, Loader2, CheckCircle } from 'lucide-react';

const PortfolioSubmissionModal = ({ isOpen, onClose, project }) => {
    const [description, setDescription] = useState('');
    const [websiteLink, setWebsiteLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Polish description with AI (placeholder - integrate with actual AI API)
            const { data: polished, error: polishError } = await supabase
                .rpc('polish_description', { raw_description: description });

            if (polishError) throw polishError;

            // Add to portfolio
            const { error: portfolioError } = await supabase
                .from('portfolio')
                .insert({
                    worker_id: project.worker_id,
                    project_id: project.id,
                    image_url: project.final_file,
                    service_type: project.service_type,
                    description: description,
                    website_link: websiteLink,
                    ai_polished_description: polished || description
                });

            if (portfolioError) throw portfolioError;

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setDescription('');
                setWebsiteLink('');
            }, 2000);

        } catch (error) {
            console.error('Portfolio submission error:', error);
            alert('Failed to add to portfolio. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {success ? (
                    <div className="text-center py-8">
                        <div className="inline-flex p-6 bg-green-500/10 rounded-full mb-4">
                            <CheckCircle size={48} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Added to Portfolio!</h3>
                        <p className="text-white/60 text-sm">Your work is now showcased</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-plaiz-blue/10 rounded-2xl">
                                <Sparkles size={24} className="text-plaiz-blue" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Add to Portfolio</h3>
                                <p className="text-white/40 text-sm">Showcase your work</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">
                                    Describe this project
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell the story behind this project..."
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-plaiz-blue focus:ring-1 focus:ring-plaiz-blue outline-none transition-colors resize-none"
                                />
                                <p className="text-xs text-white/30 mt-2 flex items-center gap-2">
                                    <Sparkles size={12} />
                                    AI will polish your description
                                </p>
                            </div>

                            {project.service_type === 'web' && (
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">
                                        Website Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={websiteLink}
                                        onChange={(e) => setWebsiteLink(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-plaiz-blue focus:ring-1 focus:ring-plaiz-blue outline-none transition-colors"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-plaiz-blue text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add to Portfolio'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-6 py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default PortfolioSubmissionModal;
