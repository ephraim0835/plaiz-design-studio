
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Project, ProjectStatus, Profile } from '../types';
import { paymentService } from '../services/paymentService';
import PaystackButton from '../components/payment/PaystackButton';
import FilePreview from '../components/project/FilePreview';
import {
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    MessageSquare,
    ShieldCheck,
    ArrowLeft,
    Download,
    Upload,
    Loader2 as Spinner
} from 'lucide-react';

const ProjectDashboard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { user, role } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [agreement, setAgreement] = useState<any>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [workerProfile, setWorkerProfile] = useState<Profile | null>(null);
    const [proposedPrice, setProposedPrice] = useState('');
    const [submittingPrice, setSubmittingPrice] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (projectId) {
            fetchProjectDetails();
            const subscription = supabase
                .channel(`project-${projectId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, () => {
                    fetchProjectDetails();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'agreements', filter: `project_id=eq.${projectId}` }, () => {
                    fetchAgreement();
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*, profiles:worker_id(*)')
                .eq('id', projectId)
                .single();

            if (error) throw error;
            setProject(data);
            if (data.profiles) setWorkerProfile(data.profiles);

            fetchAgreement();
            fetchFiles();
        } catch (err) {
            console.error('Error fetching project:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAgreement = async () => {
        const { data } = await supabase
            .from('agreements')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        setAgreement(data);
    };

    const fetchFiles = async () => {
        const { data } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', projectId);
        setFiles(data || []);
    };

    const handleAcceptPrice = async () => {
        if (!agreement) return;

        const updates = role === 'client' ? { client_agreed: true } : { freelancer_agreed: true };

        const { error } = await supabase
            .from('agreements')
            .update(updates)
            .eq('id', agreement.id);

        if (error) {
            alert(error.message);
            return;
        }

        // If both agreed, update project status
        // Refetch agreement to check latest state
        const { data: latest } = await supabase
            .from('agreements')
            .select('*')
            .eq('id', agreement.id)
            .single();

        if (latest && latest.client_agreed && latest.freelancer_agreed) {
            await supabase.from('projects').update({ status: 'pending_down_payment' }).eq('id', projectId);
        }
    };

    const handleProposePrice = async () => {
        if (!proposedPrice || isNaN(parseFloat(proposedPrice))) return;

        setSubmittingPrice(true);
        try {
            const amount = parseFloat(proposedPrice);
            const { error: agreementError } = await supabase
                .from('agreements')
                .insert({
                    project_id: projectId,
                    freelancer_id: user?.id,
                    amount: amount,
                    freelancer_agreed: true,
                    deliverables: 'To be discussed',
                    timeline: 'To be discussed'
                });

            if (agreementError) throw agreementError;

            // Update project status to pending_agreement
            await supabase.from('projects').update({ status: 'pending_agreement' }).eq('id', projectId);

            setProposedPrice('');
            fetchAgreement();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmittingPrice(false);
        }
    };

    const handleApproveProject = async () => {
        const { error } = await supabase
            .from('projects')
            .update({ status: 'approved' })
            .eq('id', projectId);

        if (error) alert(error.message);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${projectId}/${Math.random()}.${fileExt}`;
            const filePath = `project-files/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('attachments') // Reusing the attachments bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            // 2. Insert into project_files
            const { error: dbError } = await supabase
                .from('project_files')
                .insert({
                    project_id: projectId,
                    file_name: file.name,
                    file_url: publicUrl,
                    file_type: file.type,
                    uploaded_by: user?.id
                });

            if (dbError) throw dbError;

            // 3. Update project status if first file
            if (files.length === 0) {
                await supabase.from('projects').update({ status: 'ready_for_review' }).eq('id', projectId);
            }

            fetchFiles();
        } catch (err: any) {
            console.error('Upload error:', err);
            alert('Failed to upload file: ' + err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (!project) return <div className="p-20 text-center">Project not found.</div>;

    const isClient = role === 'client';
    const canPayDown = isClient && project.status === 'pending_down_payment';
    const canPayFinal = isClient && project.status === 'approved';
    const splits = agreement ? paymentService.calculateSplits(agreement.amount) : null;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-12">
            <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors">
                <ArrowLeft size={20} /> Back
            </button>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Details & Status */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 lg:p-12 shadow-xl">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4">{project.title}</h1>
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-plaiz-blue/20 text-plaiz-blue text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {project.project_type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                        ID: {project.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>
                            <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg
                                ${project.status === 'pending' || project.status === 'assigned' ? 'bg-orange-500/10 text-orange-500' :
                                    project.status === 'pending_down_payment' ? 'bg-plaiz-cyan/10 text-plaiz-cyan' :
                                        project.status === 'in_progress' ? 'bg-plaiz-blue/10 text-plaiz-blue' :
                                            project.status === 'ready_for_review' ? 'bg-purple-500/10 text-purple-500' :
                                                project.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-green-500/10 text-green-500'}`}>
                                <Clock size={14} />
                                {project.status.toLowerCase() === 'queued' ? 'CURATING EXPERT TEAM' :
                                    project.status === 'pending' ? 'INITIALIZING' :
                                        project.status === 'assigned' ? 'WORKER NOTIFIED' :
                                            project.status === 'pending_agreement' ? 'NEGOTIATING PRICE' :
                                                project.status === 'pending_down_payment' ? 'AWAITING DOWN PAYMENT (40%)' :
                                                    project.status === 'in_progress' ? 'WORK IN PROGRESS' :
                                                        project.status === 'ready_for_review' ? 'REVIEW READY' :
                                                            project.status === 'approved' ? 'APPROVED - AWAITING FINAL PAYMENT (60%)' :
                                                                project.status === 'completed' || project.status === 'awaiting_payout' ? 'COMPLETED' :
                                                                    project.status.replace(/_/g, ' ')}
                            </div>
                        </div>

                        <p className="text-[var(--text-muted)] text-lg leading-relaxed mb-12">
                            {project.description}
                        </p>

                        {/* Agreement / Pricing Selection */}
                        {agreement ? (
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 mb-8">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6">Price Agreement</h3>
                                <div className="flex justify-between items-center">
                                    <div className="text-3xl font-black text-white">₦{agreement.amount.toLocaleString()}</div>
                                    <div className="flex gap-4">
                                        {/* Client Accept Button */}
                                        {!agreement.client_agreed && isClient && (
                                            <button onClick={handleAcceptPrice} className="px-8 py-3 bg-plaiz-blue text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                                Accept Price
                                            </button>
                                        )}
                                        {agreement.client_agreed && (
                                            <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-widest">
                                                <CheckCircle2 size={16} /> Client Accepted
                                            </div>
                                        )}

                                        {/* Worker Accept Button */}
                                        {!agreement.freelancer_agreed && !isClient && (
                                            <button onClick={handleAcceptPrice} className="px-8 py-3 bg-plaiz-blue text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                                Accept Price
                                            </button>
                                        )}
                                        {agreement.freelancer_agreed && !isClient && (
                                            <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-widest">
                                                <CheckCircle2 size={16} /> You Accepted
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            role === 'worker' && project.status === 'assigned' && (
                                <div className="bg-plaiz-blue/5 border border-plaiz-blue/20 rounded-2xl p-8 mb-8">
                                    <h3 className="text-xs font-black text-plaiz-blue uppercase tracking-[0.4em] mb-6">Propose Total Price</h3>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-black text-lg">₦</span>
                                            <input
                                                type="number"
                                                value={proposedPrice}
                                                onChange={(e) => setProposedPrice(e.target.value)}
                                                placeholder="Enter amount in NGN"
                                                className="w-full bg-background border border-plaiz-blue/20 rounded-xl p-4 pl-10 text-foreground font-bold outline-none focus:border-plaiz-blue"
                                            />
                                        </div>
                                        <button
                                            onClick={handleProposePrice}
                                            disabled={submittingPrice || !proposedPrice}
                                            className="px-8 py-4 bg-plaiz-blue text-white rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {submittingPrice ? 'Sending...' : 'Send Proposal'}
                                        </button>
                                    </div>
                                    <p className="mt-3 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                                        This will initiate the price agreement phase with the client.
                                    </p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Files Section */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 lg:p-12">
                        <h2 className="text-2xl font-black text-foreground mb-8 flex items-center gap-4">
                            <FileText size={24} className="text-plaiz-blue" />
                            Project Files
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {files.length > 0 ? files.map(file => (
                                <FilePreview
                                    key={file.id}
                                    file={file}
                                    isLocked={project.status !== 'completed'}
                                />
                            )) : (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-muted)]">
                                    No files uploaded yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar Actions */}
                <div className="space-y-8">
                    {/* Action Panel */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 shadow-xl">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-8">Actions</h3>

                        <div className="space-y-4">
                            {isClient && project.status === 'in_progress' && (
                                <button
                                    onClick={handleApproveProject}
                                    className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-3"
                                >
                                    <CheckCircle2 size={20} /> Approve Project
                                </button>
                            )}

                            {role === 'worker' && (project.status === 'in_progress' || project.status === 'ready_for_review') && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full py-4 bg-plaiz-blue text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isUploading ? <Spinner className="animate-spin" size={20} /> : <Upload size={20} />}
                                        {isUploading ? 'Uploading...' : 'Submit Work'}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => navigate(`/client/messages?project=${projectId}`)}
                                className="w-full py-4 bg-surface border border-border text-foreground rounded-2xl font-black uppercase tracking-widest hover:bg-background-hover transition-all flex items-center justify-center gap-3"
                            >
                                <MessageSquare size={20} /> Open Chat
                            </button>
                        </div>
                    </div>

                    {/* Worker Info */}
                    {workerProfile && (
                        <div className="bg-plaiz-blue/5 border border-plaiz-blue/10 rounded-3xl p-8">
                            <span className="text-[10px] font-black text-plaiz-blue uppercase tracking-[0.4em] block mb-6">Assigned Designer</span>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-plaiz-blue/20 overflow-hidden flex items-center justify-center text-plaiz-blue font-black">
                                    {workerProfile.avatar_url ? (
                                        <img src={workerProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        workerProfile.full_name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <p className="text-foreground font-bold">{workerProfile.full_name}</p>
                                    <p className="text-[10px] text-plaiz-blue font-black uppercase tracking-widest">{workerProfile.specialization || 'Verified Expert'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDashboard;
