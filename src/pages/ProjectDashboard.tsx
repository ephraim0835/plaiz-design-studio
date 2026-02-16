
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
    CreditCard,
    Wallet,
    Banknote,
    ExternalLink,
    AlertCircle,
    Loader2 as Spinner
} from 'lucide-react';
import { Payout } from '../types';

const ProjectDashboard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { user, role } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [agreement, setAgreement] = useState<any>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [workerProfile, setWorkerProfile] = useState<Profile | null>(null);
    const [payout, setPayout] = useState<Payout | null>(null);
    const [workerBank, setWorkerBank] = useState<any>(null);
    const [proposedPrice, setProposedPrice] = useState('');
    const [submittingPrice, setSubmittingPrice] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);
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
                .on('postgres_changes', { event: '*', schema: 'public', table: 'payouts', filter: `project_id=eq.${projectId}` }, () => {
                    fetchPayoutDetails();
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
            fetchPayoutDetails();
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

    const fetchPayoutDetails = async () => {
        if (!projectId) return;
        const { data: payoutData } = await supabase
            .from('payouts')
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

        if (payoutData) {
            setPayout(payoutData);
        }

        const workerId = payoutData?.worker_id || project?.worker_id;
        if (workerId && (role === 'admin' || role === 'worker')) {
            const { data: bankData } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('worker_id', workerId)
                .maybeSingle();
            setWorkerBank(bankData);
        }
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

    const handleMarkAsPaid = async () => {
        if (!payout) return;
        if (!confirm('Have you actually sent the manual payment to the worker?')) return;

        setIsProcessingPayout(true);
        try {
            const { data, error } = await supabase.rpc('mark_payout_as_sent', { payout_id: payout.id });
            if (error) throw error;
            if (data?.success) {
                alert('Payment marked as sent. The worker has been notified to confirm receipt.');
                fetchPayoutDetails();
            }
        } catch (err: any) {
            alert('Error marking as paid: ' + err.message);
        } finally {
            setIsProcessingPayout(false);
        }
    };

    const handleConfirmReceipt = async () => {
        if (!payout) return;
        if (!confirm('Are you sure you have received the full payment?')) return;

        setIsProcessingPayout(true);
        try {
            const { data, error } = await supabase.rpc('confirm_payout_receipt', { payout_id: payout.id });
            if (error) throw error;
            if (data?.success) {
                alert('Payment confirmed! The project is now fully completed financially.');
                fetchPayoutDetails();
            }
        } catch (err: any) {
            alert('Error confirming receipt: ' + err.message);
        } finally {
            setIsProcessingPayout(false);
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

            <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-8 lg:gap-12 pb-20">
                {/* Right Column: Sidebar Actions (Mobile Order: 1, Desktop Col: 3) */}
                <div className="order-1 lg:order-2 lg:col-span-1 space-y-8">
                    {/* Action Panel */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 lg:p-8 shadow-xl">
                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6 lg:mb-8">Actions</h3>

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
                        <div className="bg-plaiz-blue/5 border border-plaiz-blue/10 rounded-3xl p-6 lg:p-8">
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

                {/* Left Column: Details & Status (Mobile Order: 2, Desktop Col: 1-2) */}
                <div className="order-2 lg:order-1 lg:col-span-2 space-y-8">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 lg:p-12 shadow-xl">
                        <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter mb-4">{project.title}</h1>
                                <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-plaiz-blue/20 text-plaiz-blue text-[10px] font-black uppercase tracking-widest rounded-full">
                                        {project.project_type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                        ID: {project.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>
                            <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg w-full lg:w-auto justify-center lg:justify-start
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

                        <p className="text-[var(--text-muted)] text-base lg:text-lg leading-relaxed mb-12">
                            {project.description}
                        </p>

                        {/* Agreement / Pricing Selection */}
                        {agreement ? (
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 lg:p-8 mb-8">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-6">Price Agreement</h3>
                                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                                    <div className="text-3xl font-black text-white">₦{agreement.amount.toLocaleString()}</div>
                                    <div className="flex flex-col w-full lg:w-auto gap-4">
                                        {/* Client Accept Button */}
                                        {!agreement.client_agreed && isClient && (
                                            <button onClick={handleAcceptPrice} className="w-full lg:w-auto px-8 py-3 bg-plaiz-blue text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                                Accept Price
                                            </button>
                                        )}
                                        {agreement.client_agreed && (
                                            <div className="flex items-center justify-center lg:justify-start gap-2 text-green-500 font-bold text-xs uppercase tracking-widest">
                                                <CheckCircle2 size={16} /> Client Accepted
                                            </div>
                                        )}

                                        {/* Worker Accept Button */}
                                        {!agreement.freelancer_agreed && !isClient && (
                                            <button onClick={handleAcceptPrice} className="w-full lg:w-auto px-8 py-3 bg-plaiz-blue text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                                Accept Price
                                            </button>
                                        )}
                                        {agreement.freelancer_agreed && !isClient && (
                                            <div className="flex items-center justify-center lg:justify-start gap-2 text-green-500 font-bold text-xs uppercase tracking-widest">
                                                <CheckCircle2 size={16} /> You Accepted
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            role === 'worker' && project.status === 'assigned' && (
                                <div className="bg-plaiz-blue/5 border border-plaiz-blue/20 rounded-2xl p-6 lg:p-8 mb-8">
                                    <h3 className="text-xs font-black text-plaiz-blue uppercase tracking-[0.4em] mb-6">Propose Total Price</h3>
                                    <div className="flex flex-col lg:flex-row gap-4">
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
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 lg:p-12">
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

                    {/* Admin/Worker Payout Panel */}
                    {(project.status === 'completed' || project.status === 'awaiting_payout' || payout) && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Payout Summary Card */}
                            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-plaiz-blue/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-plaiz-blue/10 transition-all" />

                                <h2 className="text-[10px] font-bold text-plaiz-blue uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-plaiz-blue animate-pulse" />
                                    Project Payment Summary
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Client Total Paid</p>
                                        <div className="text-4xl font-black text-white tracking-tighter">
                                            ₦{(agreement?.amount || 0).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="space-y-2 p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-plaiz-cyan uppercase tracking-widest">Worker Share (60%)</p>
                                        <div className="text-3xl font-black text-plaiz-cyan tracking-tighter">
                                            ₦{((agreement?.amount || 0) * 0.6).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="space-y-2 p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-plaiz-blue uppercase tracking-widest">Agency split (40%)</p>
                                        <div className="text-3xl font-black text-plaiz-blue tracking-tighter">
                                            ₦{((agreement?.amount || 0) * 0.4).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Payout State Tracking */}
                                {payout && (
                                    <div className="mt-12 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg
                                                ${payout.status === 'payment_verified' ? 'bg-green-500/20 text-green-500' :
                                                    payout.status === 'payment_sent' ? 'bg-plaiz-blue/20 text-plaiz-blue' :
                                                        'bg-white/5 text-white/20'}`}>
                                                {payout.status === 'payment_verified' ? <ShieldCheck size={28} /> : <Clock size={28} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Payment Status</p>
                                                <p className="text-lg font-black text-white uppercase tracking-tight">
                                                    {payout.status === 'awaiting_payment' ? 'Awaiting Worker Payment' :
                                                        payout.status === 'payment_sent' ? 'Payment Sent (Pending Verification)' :
                                                            payout.status === 'payment_verified' ? 'Payment Verified & Completed' :
                                                                payout.status.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Worker Confirmation Action */}
                                        {role === 'worker' && payout.status === 'payment_sent' && (
                                            <button
                                                onClick={handleConfirmReceipt}
                                                disabled={isProcessingPayout}
                                                className="px-10 py-5 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                                            >
                                                {isProcessingPayout ? <Spinner className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                                Confirm Payment Received
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Admin and Worker Payout Details */}
                            {(role === 'admin' || role === 'worker') && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Worker Bank Details */}
                                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 shadow-xl">
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-8">Worker Payment Details</h3>
                                        {workerBank ? (
                                            <div className="space-y-6">
                                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Bank Name</span>
                                                        <span className="text-white font-black uppercase text-sm">{workerBank.bank_name}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center group/account">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Account Number</span>
                                                        <span className="text-plaiz-cyan font-mono font-black text-lg">{workerBank.account_number}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Account Name</span>
                                                        <span className="text-white font-black uppercase text-xs text-right">{workerBank.account_name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-4 bg-plaiz-blue/10 rounded-xl text-plaiz-blue text-[10px] font-bold uppercase tracking-widest border border-plaiz-blue/20">
                                                    <AlertCircle size={14} />
                                                    Please verify details manually before transfer.
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-white/20 font-bold uppercase tracking-widest text-xs">
                                                No bank details found for this worker.
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Action for Admin */}
                                    {payout && payout.status === 'awaiting_payment' && (
                                        <div className="bg-[var(--card-bg)] border border-plaiz-blue/10 rounded-3xl p-8 flex flex-col justify-center items-center gap-8 shadow-xl">
                                            <div className="w-20 h-20 rounded-full bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                                                <Banknote size={40} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-xl font-black text-white mb-2">Issue Payment</h3>
                                                <p className="text-white/40 text-xs font-medium max-w-[280px]">Mark this as paid once you've successfully transferred the worker's share.</p>
                                            </div>
                                            <button
                                                onClick={handleMarkAsPaid}
                                                disabled={isProcessingPayout || !workerBank}
                                                className="w-full py-5 bg-plaiz-blue text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {isProcessingPayout ? <Spinner className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                                Confirm Payment Sent
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDashboard;
