import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Send, Zap, Upload, Loader2 } from 'lucide-react';
import MatchingOverlay from '../../components/project/MatchingOverlay';

const ProjectRequest = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { convertToUSD, loading: rateLoading } = useExchangeRate();

    const [loading, setLoading] = useState(false);
    const [matchingStatus, setMatchingStatus] = useState(null);
    const [assignedWorkerName, setAssignedWorkerName] = useState(null);
    const [attachments, setAttachments] = useState([]);

    const [formData, setFormData] = useState({
        service_type: 'graphic_design',
        title: '',
        description: '',
        budget: '',
        urgency: 'normal',
        // Web design specific
        project_type: 'prototype',
        // Printing specific
        item: 'T-shirt',
        quantity: 1
    });

    // Set service type from URL params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const service = params.get('type') || params.get('service');
        if (service) {
            let type = 'graphic_design';
            if (service === 'print' || service === 'printing' || service === 'print_specialist') type = 'printing';
            if (service === 'web' || service === 'web_design' || service === 'web_designer') type = 'web_design';
            if (service === 'graphic_designer') type = 'graphic_design';
            setFormData(prev => ({ ...prev, service_type: type }));
        }
    }, [location.search]);

    const getSkillFromService = (serviceType) => {
        if (serviceType === 'web_design') return 'web';
        if (serviceType === 'printing') return 'printing';
        return 'graphics';
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        setAttachments(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMatchingStatus('scanning');

        try {
            // Step 1: Match worker using AI algorithm

            // Step 1: Match worker using AI algorithm
            await new Promise(r => setTimeout(r, 1000));
            setMatchingStatus('evaluating');

            const skill = getSkillFromService(formData.service_type);
            const { data: workerId, error: matchError } = await supabase
                .rpc('match_worker_to_project', {
                    p_skill: skill
                });

            if (matchError) {
                console.error('Matching error:', matchError);
            }

            if (!workerId) {
                alert('No available workers match your budget. Please try increasing it or we\'ll manually assign someone soon.');
                setLoading(false);
                setMatchingStatus(null);
                return;
            }

            // Get worker name
            const { data: workerProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', workerId)
                .single();

            setAssignedWorkerName(workerProfile?.full_name || 'Expert');
            setMatchingStatus('assigning');
            await new Promise(r => setTimeout(r, 800));

            // Step 2: Upload attachments if any
            let attachmentUrls = [];
            if (attachments.length > 0) {
                for (const file of attachments) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('project-files')
                        .upload(fileName, file);

                    if (!uploadError && uploadData) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('project-files')
                            .getPublicUrl(fileName);
                        attachmentUrls.push(publicUrl);
                    }
                }
            }

            // Step 3: Create project
            const projectData = {
                title: formData.title,
                description: formData.description,
                service_type: formData.service_type,
                budget: 0,
                urgency: formData.urgency,
                client_id: user.id,
                worker_id: workerId,
                status: 'assigned',
                attachments: attachmentUrls.length > 0 ? attachmentUrls : null
            };

            // Add service-specific fields
            if (formData.service_type === 'web_design') {
                projectData.project_type = formData.project_type;
            } else if (formData.service_type === 'printing') {
                projectData.item = formData.item;
                projectData.quantity = formData.quantity;
            }

            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                    ...projectData,
                    project_type: projectData.service_type // Ensure project_type is set for compatibility
                })
                .select()
                .single();

            if (projectError) throw projectError;

            // Step 4: Create conversation
            const { data: conversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                    type: 'project',
                    project_id: project.id,
                    participants: [user.id, workerId]
                })
                .select()
                .single();

            if (convError) throw convError;

            // Step 5: Link conversation to project
            await supabase
                .from('projects')
                .update({ conversation_id: conversation.id })
                .eq('id', project.id);

            // Step 6: Send system message
            await supabase
                .from('messages')
                .insert({
                    conversation_id: conversation.id,
                    sender_id: 'system',
                    content: "You've both been connected. Share details to begin.",
                    type: 'system'
                });

            // Step 7: Send notification to worker
            await supabase
                .from('notifications')
                .insert({
                    user_id: workerId,
                    title: 'New Project Assigned',
                    message: `You've been assigned a new ${formData.service_type.replace('_', ' ')} project: ${formData.title}`,
                    type: 'project_assigned',
                    project_id: project.id,
                    link: `/dashboard/messages/project/${project.id}`
                });

            setMatchingStatus('success');
            await new Promise(r => setTimeout(r, 1500));

            // Step 8: Redirect to chat
            navigate(`/dashboard/messages/project/${project.id}`);

        } catch (error) {
            console.error('Project creation error:', error);
            setMatchingStatus('failure');
            alert('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="ambient-bg-calm min-h-screen">
            <DashboardLayout title="Start a New Task">
                <div className="max-w-4xl mx-auto px-6 py-10 lg:py-20 animate-in fade-in duration-1000">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex p-5 glass-panel !bg-white/40 dark:!bg-white/5 !rounded-[24px] text-plaiz-blue mb-8 group hover:scale-110 transition-transform">
                            <Zap size={32} className="fill-plaiz-blue/20" />
                        </div>
                        <h1 className="text-4xl lg:text-7xl font-black text-foreground tracking-tighter mb-4 leading-none">
                            Let's start something <span className="text-plaiz-blue">great.</span>
                        </h1>
                        <p className="text-xl text-muted font-medium lg:max-w-xl mx-auto leading-relaxed">
                            Tell us what you need. <br className="hidden md:block" />
                            We'll handle the rest.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="glass-panel p-8 lg:p-14 shadow-2xl bg-surface border border-border">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Service Type */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1">
                                    What do you need?
                                </label>
                                <select
                                    value={formData.service_type}
                                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                    className="w-full h-16 px-6 bg-background border border-border rounded-2xl text-foreground font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm outline-none"
                                >
                                    <option value="graphic_design">Graphic Design</option>
                                    <option value="web_design">Web Design</option>
                                    <option value="printing">Printing Services</option>
                                </select>
                            </div>

                            {/* Title */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1">
                                    {formData.service_type === 'printing' ? 'What are you printing?' : 'Project title'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={
                                        formData.service_type === 'graphic_design' ? 'e.g. Logo for my coffee shop' :
                                            formData.service_type === 'web_design' ? 'e.g. Portfolio website' :
                                                'e.g. Company t-shirts'
                                    }
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full h-16 px-6 bg-background border border-border rounded-2xl text-foreground font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-muted/30 outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1">
                                    Describe your vision
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Tell us what you're looking for..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-6 bg-background border border-border rounded-[28px] text-foreground font-medium focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm placeholder:text-muted/30 outline-none resize-none leading-relaxed"
                                />
                            </div>

                            {/* Service-Specific Fields */}
                            {formData.service_type === 'web_design' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.3em] ml-1">
                                        What do you need?
                                    </label>
                                    <div className="flex gap-4">
                                        {['prototype', 'full_website'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, project_type: type })}
                                                className={`flex-1 h-14 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${formData.project_type === type
                                                    ? 'bg-plaiz-blue text-white border-plaiz-blue shadow-lg'
                                                    : 'bg-white/40 dark:bg-black/20 border-white/60 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-plaiz-blue/30 dark:hover:border-white/20'
                                                    }`}
                                            >
                                                {type === 'prototype' ? 'Prototype / Design' : 'Full Website'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.service_type === 'printing' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.3em] ml-1">
                                            Item
                                        </label>
                                        <select
                                            value={formData.item}
                                            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                            className="w-full h-16 px-6 bg-background border border-border rounded-2xl text-foreground font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm outline-none"
                                        >
                                            <option>T-shirt</option>
                                            <option>Hoodie</option>
                                            <option>Mug</option>
                                            <option>Joggers</option>
                                            <option>Banner</option>
                                            <option>Flyer</option>
                                            <option>Business Card</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1">
                                            How many?
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                            className="w-full h-16 px-6 bg-background border border-border rounded-2xl text-foreground font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Budget & Urgency */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1">
                                        Estimated Budget
                                    </label>
                                    <div className="w-full h-16 px-6 bg-background/50 border border-border rounded-2xl text-muted font-bold flex items-center text-sm">
                                        Negotiated in chat
                                    </div>
                                </div>

                                {formData.service_type === 'graphic_design' && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.3em] ml-1">
                                            Timeline
                                        </label>
                                        <select
                                            value={formData.urgency}
                                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                            className="w-full h-16 px-6 bg-white/40 dark:bg-black/20 border border-white/60 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-bold focus:border-plaiz-blue focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all text-sm outline-none"
                                        >
                                            <option value="normal">Normal (3-5 days)</option>
                                            <option value="priority">Priority (1-2 days)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Attachments (Optional) */}
                            {formData.service_type !== 'printing' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1">
                                        Share any files (optional)
                                    </label>
                                    <label className="w-full p-8 border-2 border-dashed border-border rounded-[28px] bg-background/50 flex flex-col items-center justify-center gap-4 group hover:bg-surface transition-all cursor-pointer">
                                        <Upload className="text-muted group-hover:text-plaiz-blue transition-colors" size={32} />
                                        <p className="text-xs font-bold text-muted uppercase tracking-widest">
                                            {attachments.length > 0 ? `${attachments.length} file(s) selected` : 'Click to upload'}
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="pt-8 flex flex-col md:flex-row gap-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-18 py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Finding your expert...
                                        </>
                                    ) : (
                                        <>
                                            Start Project <Send size={18} />
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/client')}
                                    disabled={loading}
                                    className="px-12 h-18 bg-white/20 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-gray-400 dark:text-white/40 font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Matching Overlay */}
                <MatchingOverlay
                    isOpen={!!matchingStatus}
                    status={matchingStatus}
                    workerName={assignedWorkerName}
                    targetRole={formData.service_type.replace('_', ' ')}
                />
            </DashboardLayout>
        </div>
    );
};

export default ProjectRequest;
