import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import {
    Send,
    Smile,
    Paperclip,
    Mic,
    File as FileIcon,
    Download,
    MoreVertical,
    CheckCheck,
    X,
    XCircle,
    Play,
    Pause,
    DollarSign,
    Zap,
    ChevronLeft,
    Clock,
    CheckCircle2,
    FlaskConical,
    Paperclip as PaperclipIcon,
    ShieldCheck,
    ShieldAlert,
    UploadCloud,
    Trash2
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import ProjectStatusTracker from '../project/ProjectStatusTracker';
import PricingProposalForm from '../project/PricingProposalForm';
import VoiceRecorder from './VoiceRecorder';
import AgreementCard from '../project/AgreementCard';
import PaymentModal from '../project/PaymentModal';
import FinalWorkModal from '../project/FinalWorkModal';
import { PriceProposalCard, PaymentWorkflowCard, SampleReviewCard } from './WorkflowCards';
import { Message } from '../../types';

interface ProjectChatProps {
    projectId: string;
    projectTitle: string;
}

const SafetyBanner = () => (
    <div className="bg-amber-500/10 border-y border-amber-500/20 px-6 py-1.5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldAlert size={14} />
        </div>
        <p className="text-[10px] md:text-[11px] font-bold text-amber-700 dark:text-amber-500/80 leading-tight uppercase tracking-tight">
            Safety First: Keep all chat and payments on Plaiz Design to stay protected. Taking work off-site voids our security guarantees.
        </p>
    </div>
);

const PreviewModeBanner = () => (
    <div className="bg-plaiz-blue/10 border-y border-plaiz-blue/20 px-6 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
        <div className="w-6 h-6 rounded-full bg-plaiz-blue/20 flex items-center justify-center text-plaiz-blue shrink-0">
            <FlaskConical size={14} />
        </div>
        <p className="text-[10px] md:text-[11px] font-black text-plaiz-blue leading-tight uppercase tracking-[0.1em]">
            Preview Mode — Files unlock after final payment
        </p>
    </div>
);

const MatchingOverlay = () => (
    <div className="absolute inset-0 z-[100] bg-background/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle at 2px 2px, var(--plaiz-blue) 1px, transparent 0)`, backgroundSize: '32px 32px' }}
        />

        <div className="relative mb-12">
            {/* Pulsing Core */}
            <div className="w-32 h-32 rounded-[48px] bg-plaiz-blue/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-[48px] border-2 border-plaiz-blue/30 animate-ping duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-br from-plaiz-blue/20 to-transparent" />
                <Zap size={56} className="text-plaiz-blue animate-pulse relative z-10" />
            </div>

            {/* Spinning Technical Rings */}
            <div className="absolute -inset-4 border border-plaiz-blue/5 rounded-full animate-spin duration-[10s]" />
            <div className="absolute -inset-8 border border-plaiz-blue/5 rounded-full animate-reverse-spin duration-[15s]" />
        </div>

        <div className="max-w-md space-y-6">
            <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-black text-plaiz-blue uppercase tracking-[0.5em] mb-2 animate-pulse">Neural Pathing Active</span>
                <h3 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter leading-none">
                    Curating Your <br />
                    <span className="text-plaiz-blue underline decoration-plaiz-blue/20 underline-offset-8">Expert Team.</span>
                </h3>
            </div>

            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest max-w-sm leading-relaxed opacity-60">
                AntiGravity is analyzing your brief and matching you with a top-rated creative professional.
            </p>

            <div className="flex flex-col items-center gap-4 pt-8">
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-plaiz-blue animate-bounce shadow-[0_0_12px_rgba(47,128,237,0.4)]" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Processing Secure Match...</span>
            </div>
        </div>
    </div>
);

const NoWorkerOverlay = () => (
    <div className="absolute inset-0 z-[100] bg-background/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
        <div className="relative mb-12">
            <div className="w-32 h-32 rounded-[48px] bg-rose-500/10 flex items-center justify-center relative overflow-hidden">
                <ShieldAlert size={56} className="text-rose-500 animate-pulse relative z-10" />
            </div>
            <div className="absolute -inset-4 border border-rose-500/5 rounded-full" />
        </div>

        <div className="max-w-md space-y-6">
            <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-2">System Alert</span>
                <h3 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter leading-none">
                    Manual Review <br />
                    <span className="text-rose-500 underline decoration-rose-500/20 underline-offset-8">Required.</span>
                </h3>
            </div>

            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest max-w-sm leading-relaxed opacity-60">
                Our AI couldn't find an available expert matching your exact criteria right now. An administrator has been notified to manually assign a specialist to your project.
            </p>

            <div className="flex flex-col items-center gap-4 pt-8">
                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Support Ticket Created</span>
            </div>
        </div>
    </div>
);

const CancelledOverlay = ({ reason }: { reason?: string }) => (
    <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
        <div className="relative mb-12">
            <div className="w-32 h-32 rounded-[48px] bg-muted/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent" />
                <XCircle size={56} className="text-muted-foreground relative z-10" />
            </div>
            <div className="absolute -inset-4 border border-muted/20 rounded-full" />
        </div>

        <div className="max-w-md space-y-6">
            <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] mb-2">Project Closed</span>
                <h3 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter leading-none">
                    Project <br />
                    <span className="text-muted-foreground underline decoration-muted/20 underline-offset-8">Cancelled.</span>
                </h3>
            </div>

            {reason && (
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest max-w-sm leading-relaxed opacity-60">
                    {reason}
                </p>
            )}
            {!reason && (
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest max-w-sm leading-relaxed opacity-60">
                    This project has been cancelled and is no longer active. Please contact support if you believe this was a mistake.
                </p>
            )}

            <div className="flex flex-col items-center gap-4 pt-8">
                <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">No Further Action Required</span>
            </div>
        </div>
    </div>
);

const AcceptanceOverlay: React.FC<{
    project: any,
    onAccept: () => void,
    onDecline: () => void,
    deadline?: string
}> = ({ project, onAccept, onDecline, deadline }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!deadline) return;
        const interval = setInterval(() => {
            const diff = new Date(deadline).getTime() - new Date().getTime();
            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                clearInterval(interval);
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return (
        <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-md w-full space-y-8">
                <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-plaiz-blue/10 text-plaiz-blue text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Clock size={12} /> Assignment Pending
                    </span>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">Accept this Mission?</h3>
                    <p className="text-muted-foreground text-sm font-medium">You have been selected as the best expert for this project.</p>
                </div>

                <div className="bg-surface/50 border border-border rounded-3xl p-6 text-left space-y-4">
                    <div>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest block mb-1">Project Brief</span>
                        <h4 className="font-bold text-lg text-foreground">{project?.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{project?.description}</p>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <div className="flex justify-between items-center bg-plaiz-blue/5 p-4 rounded-2xl">
                            <span className="text-xs font-bold text-plaiz-blue">TIME REMAINING</span>
                            <span className="text-2xl font-black text-plaiz-blue font-mono">{timeLeft}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onAccept}
                        className="w-full py-4 bg-plaiz-blue text-white font-black rounded-2xl shadow-xl shadow-plaiz-blue/20 hover:scale-[1.02] active:scale-95 transition-all uppercase text-sm tracking-widest"
                    >
                        ACCEPT WORK ⚡
                    </button>
                    <button
                        onClick={onDecline}
                        className="w-full py-4 text-rose-500 font-bold hover:bg-rose-500/5 rounded-2xl transition-all uppercase text-[11px] tracking-widest"
                    >
                        I CANNOT DO THIS
                    </button>
                </div>

                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tight">
                    Acceptance opens the chat and locks the project to you.
                </p>
            </div>
        </div>
    );
};

const ProjectChat: React.FC<ProjectChatProps> = ({ projectId, projectTitle }) => {
    const { user, profile } = useAuth();
    const currentUserRole = profile?.role === 'client' ? 'client' : (profile?.role === 'admin' ? 'admin' : 'worker');

    const { messages, loading, sendMessage, deleteMessage, isSending: hookIsSending } = useMessages(projectId) as {
        messages: Message[],
        loading: boolean,
        isSending: boolean,
        sendMessage: (content: string, senderId: string, attachment?: File | null, isVoiceNote?: boolean, payload?: any) => Promise<{ success: boolean, error?: string }>,
        deleteMessage: (messageId: string) => Promise<{ success: boolean, error?: string }>
    };

    const [newMessage, setNewMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [showProposalForm, setShowProposalForm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activePayment, setActivePayment] = useState<{ phase: 'deposit_40' | 'balance_60', amount: number } | null>(null);
    const [showFinalWorkModal, setShowFinalWorkModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [project, setProject] = useState<any>(null);
    const [agreement, setAgreement] = useState<any>(null);
    const [localSending, setLocalSending] = useState(false);
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const isMatching = project?.status === 'matching';
    const isNoWorker = project?.status === 'NO_WORKER_AVAILABLE';
    const isCancelled = project?.status === 'cancelled';
    const isAssignedPending = project?.status === 'assigned' && currentUserRole === 'worker';
    const isChatLocked = project?.status === 'assigned' || project?.status === 'matching' || project?.status === 'NO_WORKER_AVAILABLE' || project?.status === 'cancelled';

    useEffect(() => {
        const fetchProjectData = async () => {
            const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
            if (proj) setProject(proj);

            const { data: agr } = await supabase.from('agreements')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (agr) setAgreement(agr);
        };
        fetchProjectData();

        // Subscribe to project and agreement changes
        const sub = supabase.channel(`project-updates-${projectId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
                payload => setProject(payload.new))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agreements', filter: `project_id=eq.${projectId}` },
                payload => {
                    if (payload.new) setAgreement(payload.new);
                })
            .subscribe();

        return () => { sub.unsubscribe(); };
    }, [projectId]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = (force = false) => {
        if (!messagesEndRef.current || !messagesContainerRef.current) return;
        messagesEndRef.current.scrollIntoView({ behavior: force ? 'auto' : 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) scrollToBottom();
    }, [messages.length]);

    const isSending = localSending || hookIsSending;
    const isWorkerLocked = currentUserRole === 'worker' &&
        !['work_started', 'review_samples', 'awaiting_final_payment', 'completed'].includes(project?.status);
    const hasSubmittedProposal = messages.some(m => m.payload?.type === 'agreement_proposal');

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const content = newMessage.trim();
        if (!content && attachments.length === 0) return;
        if (isSending || isUploading) return;

        setLocalSending(true);
        if (attachments.length > 0) setIsUploading(true);

        try {
            let payload = null;

            // If worker is uploading a file during work_started phase, mark as sample review
            if (attachments.length > 0 && currentUserRole !== 'client' && project?.status === 'work_started') {
                // Update status to review_samples
                await supabase.from('projects').update({ status: 'review_samples' }).eq('id', projectId);

                payload = {
                    type: 'sample_review',
                    samples: attachments.map(f => ({
                        url: URL.createObjectURL(f), // Temporary URL for optimistic UI, real URL will be in the message
                        name: f.name
                    }))
                };
            }

            const result = await sendMessage(content, user.id, attachments[0] || null, false, payload);

            // If it was a sample review, we need to refresh the message to get the real URL
            if (payload?.type === 'sample_review') {
                // The hook will pick up the real URL via subscription
            }

            if (result?.success) {
                setNewMessage('');
                setAttachments([]);
                if (textAreaRef.current) textAreaRef.current.style.height = 'auto';
            } else if (result?.error) {
                alert(`Failed to send: ${result.error}`);
            }
        } catch (err: any) {
            console.error('Send error:', err);
            alert('A system error occurred while sending.');
        } finally {
            setLocalSending(false);
            setIsUploading(false);
        }
    };

    const handleVoiceSend = async (audioFile: File) => {
        if (isUploading) return;
        setIsUploading(true);
        try {
            const result = await sendMessage('Voice Note', user.id, audioFile, true);
            if (result?.success) setIsRecording(false);
        } finally {
            setIsUploading(false);
        }
    };

    const handlePlayAudio = (url: string, messageId: string) => {
        if (playingAudioId === messageId) {
            // Stop current
            audioRef.current?.pause();
            audioRef.current = null;
            setPlayingAudioId(null);
        } else {
            // Stop previous if exists
            if (audioRef.current) {
                audioRef.current.pause();
            }
            // Play new
            const audio = new Audio(url);
            audio.onended = () => setPlayingAudioId(null);
            audio.play().catch(e => console.error("Audio playback error:", e));
            audioRef.current = audio;
            setPlayingAudioId(messageId);
        }
    };

    const handleRequestChanges = async () => {
        if (!agreement) return;

        const revisionNote = window.prompt("What should the worker change in this proposal? (Optional)");

        try {
            // Mark agreement as revision requested
            await supabase
                .from('agreements')
                .update({
                    status: 'revision_requested',
                    client_agreed: false,
                    payload: {
                        ...agreement.payload,
                        revision_note: revisionNote || 'No specific note provided.'
                    }
                })
                .eq('id', agreement.id);

            // Reset project to in_progress so worker can re-submit
            await supabase
                .from('projects')
                .update({ status: 'in_progress' })
                .eq('id', projectId);

            // Post a system message so the worker sees what to fix
            const content = revisionNote
                ? `🔄 Revision Requested: "${revisionNote}"`
                : '🔄 The client has requested revisions to your proposal. Please review their feedback and submit an updated quote.';

            await supabase.from('messages').insert({
                project_id: projectId,
                sender_id: user.id,
                content: content,
                is_system_message: true,
                payload: {
                    type: 'revision_request',
                    note: revisionNote
                }
            });
        } catch (err: any) {
            console.error('Error requesting changes:', err);
            alert('Could not request changes: ' + err.message);
        }
    };

    const handleProposalSubmit = async (amount: number, deliverables: string, timeline: string, notes: string, cost?: number) => {
        try {
            // Calculate profit for printing
            const profitValue = cost !== undefined ? (amount - cost) : 0;

            const { error } = await supabase.rpc('submit_price_proposal', {
                p_project_id: projectId,
                p_worker_id: user.id,
                p_amount: amount,
                p_deliverables: deliverables,
                p_timeline: timeline,
                p_notes: notes,
                p_profit: profitValue // New parameter for AntiGravity profit-based split
            });
            if (error) throw error;
            setShowProposalForm(false);
        } catch (err: any) {
            console.error('Error submitting proposal:', err);
            alert('Failed to submit proposal: ' + err.message);
        }
    };


    const handleAcceptProposal = async () => {
        try {
            if (!agreement) return;

            // Trigger RPC to lock it and update project status
            const { error: rpcError } = await supabase.rpc('confirm_agreement', {
                p_project_id: projectId,
                p_agreement_id: agreement.id
            });

            if (rpcError) throw rpcError;

            // Send system message for payment prompt (already handled by RPC message insertion? 
            // Better to keep it explicit for the interactive payment request card)
            const isPrinting = project?.skill === 'printing';
            const paymentPrompt = isPrinting
                ? `Proposal accepted. Please pay the full 100% amount of ₦${agreement.amount.toLocaleString()} to begin production.`
                : `Proposal accepted. Please pay the 40% deposit of ₦${(agreement.amount * 0.4).toLocaleString()} to begin work.`;

            await sendMessage(paymentPrompt, user.id, null, false, {
                type: 'payment_request',
                phase: isPrinting ? 'full_100' : 'deposit_40',
                amount: isPrinting ? agreement.amount : agreement.amount * 0.4
            });

        } catch (err: any) {
            console.error('Accept Proposal Error', err);
            alert('Error: ' + err.message);
        }
    };

    const handlePaymentSuccess = async (phase: 'deposit_40' | 'balance_60', amount: number) => {
        try {
            const { error } = await supabase.rpc('process_client_payment_success', {
                p_project_id: projectId,
                p_client_id: user.id,
                p_transaction_ref: 'paystack_' + Math.random().toString(36).substring(7),
                p_amount: amount,
                p_phase: phase
            });
            if (error) throw error;
            setShowPaymentModal(false);
        } catch (err: any) {
            console.error('Payment Error', err);
            alert('Error processing payment: ' + err.message);
        }
    };

    const handleApproveSamples = async () => {
        try {
            if (!agreement) return;
            // Update project status to awaiting_final_payment
            await supabase
                .from('projects')
                .update({ status: 'awaiting_final_payment' })
                .eq('id', projectId);

            // Send system message for final payment
            await sendMessage(`Samples approved! Please pay the remaining 60% balance (₦${(agreement.amount * 0.6).toLocaleString()}) to unlock final files.`, user.id, null, false, {
                type: 'payment_request',
                phase: 'balance_60',
                amount: agreement.amount * 0.6
            });

        } catch (err: any) {
            console.error('Approve Samples Error', err);
            alert('Error: ' + err.message);
        }
    };

    const handleRequestRevision = async () => {
        const feedback = prompt("Please provide your revision feedback:");
        if (!feedback) return;

        try {
            await sendMessage(`Revision Request: ${feedback}`, user.id, null, false);
            await supabase.from('projects').update({ status: 'work_started' }).eq('id', projectId);
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;

        try {
            const { success, error } = await deleteMessage(messageId);
            if (!success) throw new Error(error);
        } catch (err: any) {
            console.error('Error deleting message:', err);
            alert('Failed to delete message: ' + err.message);
        }
    };



    const handleApproveDelivery = async () => {
        if (!confirm("Are you sure you want to approve this delivery? This will release funds to the worker.")) return;
        try {
            // Triggers auto-gallery and worker rotation update logic (Phase 16/18)
            const { error } = await supabase.rpc('approve_final_delivery', {
                p_project_id: projectId,
                p_client_id: user.id
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('Approve Delivery Error', err);
            alert('Error: ' + err.message);
        }
    };

    const handleDeclineWork = async () => {
        const reason = prompt("Why can't you take this project? (e.g. Too busy, Deadline too short, Not skilled for this)");
        if (!reason) return;

        try {
            const { error } = await supabase.rpc('request_reassignment', {
                p_project_id: projectId,
                p_reason: reason
            });

            if (error) throw error;
            alert("Project declined. Finding next expert...");
            // Optional: redirect or refresh
        } catch (err: any) {
            alert("Error declining: " + err.message);
        }
    };

    const handleClientReassign = async () => {
        if (!confirm("Are you sure? This will remove the current expert and find a new one. This is only allowed if NO payments have been made.")) return;
        const reason = prompt("Please provide a reason for reassignment:");
        if (!reason) return;

        try {
            const { error } = await supabase.rpc('request_reassignment', {
                p_project_id: projectId,
                p_reason: reason
            });

            if (error) throw error;
            alert("Reassignment requested. We are finding a new expert for you.");
            setShowActionsDropdown(false);
        } catch (err: any) {
            alert("Failed to reassign: " + err.message);
        }
    };

    const handleAcceptWork = async () => {
        try {
            const { error } = await supabase.from('projects').update({
                status: 'waiting_for_client'
            }).eq('id', projectId);
            if (error) throw error;
        } catch (err: any) {
            alert("Error accepting: " + err.message);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const [showActionsDropdown, setShowActionsDropdown] = useState(false);

    return (
        <div className={`flex flex-col h-[100svh] lg:h-full overflow-hidden relative transition-all duration-500 chat-stage-bg lg:rounded-2xl z-20`}>

            {isMatching && <MatchingOverlay />}
            {isNoWorker && <NoWorkerOverlay />}
            {isCancelled && <CancelledOverlay reason={project?.rejection_reason} />}
            {isAssignedPending && (
                <AcceptanceOverlay
                    project={project}
                    onAccept={handleAcceptWork}
                    onDecline={handleDeclineWork}
                    deadline={project.assignment_deadline}
                />
            )}

            <div className="flex h-16 lg:h-20 border-b border-border px-4 lg:px-6 items-center justify-between shrink-0 z-[40] 
                bg-card/95 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue border border-plaiz-blue/20">
                        <Zap size={20} className="fill-plaiz-blue/20" />
                    </div>
                    <div>
                        <h4 className="text-foreground font-bold text-[15px] tracking-tight truncate max-w-[150px] lg:max-w-none">{projectTitle}</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </div>

                {/* Client Actions Dropdown */}
                {currentUserRole === 'client' && !isChatLocked && (
                    <div className="relative">
                        <button
                            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
                        >
                            <MoreVertical size={20} className="text-muted-foreground" />
                        </button>

                        {showActionsDropdown && (
                            <>
                                <div className="fixed inset-0 z-[40]" onClick={() => setShowActionsDropdown(false)} />
                                <div className="absolute right-0 top-12 w-48 bg-background border border-border rounded-xl shadow-xl z-[50] p-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={handleClientReassign}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                                    >
                                        <ShieldAlert size={14} />
                                        Request Reassignment
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-0 lg:gap-0">
                <ProjectStatusTracker status={project?.status} />
                {currentUserRole === 'client' && <SafetyBanner />}
                {project?.status !== 'completed' && <PreviewModeBanner />}
            </div>

            {/* Phase 18: Client Payment Overlay */}
            {project?.status === 'pending_agreement' && agreement && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-top-4 w-full max-w-md px-4 pointer-events-none">
                    <div className="pointer-events-auto shadow-2xl">
                        <AgreementCard
                            agreement={agreement}
                            currentUserRole={currentUserRole}
                            projectStatus={project?.status}
                            onUpdate={() => {
                                if (currentUserRole === 'client') setShowPaymentModal(true);
                            }}
                            onReject={async () => {
                                const reason = prompt("Reason for declining (optional):") || "Client requested changes.";
                                try {
                                    const { error } = await supabase.rpc('reject_price_proposal', {
                                        p_project_id: projectId,
                                        p_reason: reason
                                    });
                                    if (error) throw error;
                                    alert("Proposal declined. Worker has been notified.");
                                } catch (err: any) {
                                    console.error('Reject Error', err);
                                    alert('Error: ' + err.message);
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto pt-4 lg:pt-16 pb-16 px-4 lg:px-12 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full pt-32 text-gray-400/20">
                            <div className="w-24 h-24 rounded-[48px] border-2 border-dashed border-border/40 flex items-center justify-center mb-6">
                                <Zap size={40} className="text-plaiz-blue/20" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-center">Connection established</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user?.id;
                        const isAdmin = msg.profiles?.role === 'admin';
                        const isRead = msg.is_read;
                        const isNextFromSame = messages[i + 1]?.sender_id === msg.sender_id;

                        // Modern Bubble Styles based on user preferences
                        const bubbleStyles = isMe
                            ? "bg-gradient-to-r from-[#2F80ED] to-[#56CCF2] dark:from-[#1C6CFF] dark:to-[#3EA6FF] text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-600/30"
                            : isAdmin
                                ? "bg-[#FFF6D6] dark:bg-[#3A3214] text-[#1A1A1A] dark:text-[#FFF4CC] border border-orange-200/50 dark:border-orange-900/30 shadow-sm"
                                : "bg-[#F1F3F5] dark:bg-[#1E1E1E] text-[#1A1A1A] dark:text-[#EAEAEA] border border-slate-200 dark:border-white/5 shadow-sm";

                        const alignment = isMe ? 'justify-end' : 'justify-start';
                        const itemsAlignment = isMe ? 'items-end' : 'items-start';
                        const animationClass = isMe ? 'animate-in slide-in-from-right-4' : 'animate-in slide-in-from-left-4';

                        const isPayload = !!msg.payload?.type;

                        return (
                            <div key={msg.id} className={`flex ${alignment} ${animationClass} fade-in duration-500 group/msg mb-2`}>
                                <div className={`flex flex-col ${itemsAlignment} ${isPayload ? 'w-full max-w-sm' : 'max-w-[75%] md:max-w-[70%]'}`}>
                                    <div className={`relative transition-all duration-300 ${isPayload ? '' : alignment === 'justify-end' ? 'rounded-[22px] rounded-tr-none' : 'rounded-[22px] rounded-tl-none'} 
                                        ${isPayload ? '' : bubbleStyles} ${!isPayload && 'hover:scale-[1.02] active:scale-[0.98]'}`}>

                                        {!isMe && !isNextFromSame && !isPayload && (
                                            <span className="text-[10px] font-black uppercase tracking-widest mb-1 block opacity-40 px-4 lg:px-6 pt-3">
                                                {msg.profiles?.full_name || 'System'}
                                            </span>
                                        )}

                                        <div className={isPayload ? '' : 'px-4 lg:px-6 py-3 lg:py-4'}>

                                            {msg.payload?.type === 'price_proposal' ? (
                                                <PriceProposalCard
                                                    amount={msg.payload.amount}
                                                    deposit={msg.payload.deposit}
                                                    balance={msg.payload.balance}
                                                    notes={msg.payload.notes}
                                                    isClient={currentUserRole === 'client'}
                                                    isInBlueBubble={isMe}
                                                    status={agreement?.status || 'pending'}
                                                    onAccept={handleAcceptProposal}
                                                    onRequestChanges={handleRequestChanges}
                                                    {...({} as any)}
                                                />
                                            ) : msg.payload?.type === 'payment_request' ? (
                                                <PaymentWorkflowCard
                                                    phase={msg.payload.phase}
                                                    amount={msg.payload.amount}
                                                    isClient={currentUserRole === 'client'}
                                                    isInBlueBubble={isMe}
                                                    isPaid={
                                                        (msg.payload.phase === 'deposit_40' && (['work_started', 'review_samples', 'awaiting_final_payment', 'completed'].includes(project?.status))) ||
                                                        (msg.payload.phase === 'balance_60' && project?.status === 'completed')
                                                    }
                                                    onPay={() => {
                                                        setActivePayment({ phase: msg.payload.phase, amount: msg.payload.amount });
                                                        setShowPaymentModal(true);
                                                    }}
                                                />
                                            ) : msg.payload?.type === 'sample_review' ? (
                                                <SampleReviewCard
                                                    samples={msg.payload.samples}
                                                    isClient={currentUserRole === 'client'}
                                                    isInBlueBubble={isMe}
                                                    status={project?.status}
                                                    onApprove={handleApproveSamples}
                                                    onRequestRevision={handleRequestRevision}
                                                />
                                            ) : msg.payload?.type === 'revision_request' ? (
                                                <div className="p-4 lg:p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-sm animate-in zoom-in-95 duration-300">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                                        <Zap size={20} className="animate-pulse" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60">Revision Requested</p>
                                                        <p className="text-sm font-bold text-amber-200 leading-relaxed italic">"{msg.payload.note || 'See notes above'}"</p>
                                                    </div>
                                                </div>
                                            ) : msg.is_voice_note && msg.attachment_url ? (
                                                <div className="flex items-center gap-4 min-w-[280px] py-1">
                                                    <button
                                                        onClick={() => handlePlayAudio(msg.attachment_url!, msg.id)}
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${isMe ? 'bg-white/20 text-white' : 'bg-plaiz-blue/10 text-plaiz-blue'}`}
                                                    >
                                                        {playingAudioId === msg.id ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-1" fill="currentColor" />}
                                                    </button>
                                                    <div className="flex-1 space-y-2">
                                                        <div className={`h-1.5 w-full bg-current opacity-20 rounded-full relative overflow-hidden`}>
                                                            <div className="absolute inset-0 bg-current w-1/3" />
                                                        </div>
                                                        <div className="flex items-center justify-between opacity-60">
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Voice Note</span>
                                                            <span className="text-[9px] font-bold">0:12</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : msg.attachment_url && (
                                                <div className="mb-4 rounded-2xl overflow-hidden bg-black/5 p-1 relative border border-white/10">
                                                    {msg.attachment_type === 'image' ? (
                                                        <button
                                                            onClick={() => setSelectedImageUrl(msg.attachment_url || null)}
                                                            className="w-full text-left focus:outline-none"
                                                        >
                                                            <img src={msg.attachment_url} alt="" className={`max-w-full h-auto max-h-[500px] object-cover rounded-xl ${project?.status !== 'completed' && !isMe ? 'blur-[1px] grayscale-[0.2]' : ''}`} />
                                                        </button>
                                                    ) : (
                                                        <div className={`p-4 flex items-center gap-4 rounded-xl ${isMe ? 'bg-white/10' : 'bg-background/40'}`}>
                                                            <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center">
                                                                <FileIcon size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold truncate">{msg.attachment_name || 'File'}</p>
                                                            </div>
                                                            <a href={msg.attachment_url} download className="p-2 hover:bg-white/10 rounded-lg transition-all"><Download size={18} /></a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(!isPayload && (!msg.is_voice_note || msg.content !== 'Voice Note')) && (
                                                <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-[1.6]">{msg.content}</p>
                                            )}

                                            {!isPayload && (
                                                <div className={`flex items-center gap-2 mt-1.5 justify-end text-[10px] ${isMe ? 'text-white/70' : 'text-muted-foreground/50'}`}>
                                                    <span className="font-bold">{formatTime(msg.created_at)}</span>
                                                    {isMe && (
                                                        <CheckCheck
                                                            size={14}
                                                            className={isRead
                                                                ? 'text-green-300 dark:text-green-400'
                                                                : 'text-white/40'
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Event Meta for Cards (Positioned outside the card container) */}
                                    {isPayload && (
                                        <div className={`flex items-center gap-2 mt-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <span className="opacity-60">{isMe ? 'Sent by you' : 'System Notification'}</span>
                                            <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                                            <span>{formatTime(msg.created_at)}</span>
                                        </div>
                                    )}

                                    {(isMe || currentUserRole === 'admin') && !isNextFromSame && (
                                        <button
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            className="mt-2 text-[9px] font-black text-rose-500/20 hover:text-rose-500 uppercase tracking-[0.2em] transition-all opacity-0 group-hover/msg:opacity-100"
                                        >
                                            Recall Message
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Floating Pill Input - Optimized for Desktop & Mobile */}
            <div className="sticky bottom-0 pb-6 lg:pb-12 pt-6 shrink-0 z-50 bg-gradient-to-t from-background to-transparent pointer-events-none">
                <div className="max-w-6xl mx-auto px-4 lg:px-6 pointer-events-auto">

                    {/* Resubmit Proposal Prompt for Workers */}
                    {currentUserRole === 'worker' && agreement?.status === 'revision_requested' && (
                        <div className="mb-4 p-6 bg-plaiz-blue text-white rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-4 duration-700 shadow-[0_20px_50px_rgba(0,123,255,0.3)]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Zap size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-widest">Update Required</h4>
                                    <p className="text-[11px] opacity-80 font-bold max-w-xs">{agreement.payload?.revision_note || 'Client requested changes to your proposal.'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProposalForm(true)}
                                className="px-8 py-3 bg-white text-plaiz-blue rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full md:w-auto shadow-xl"
                            >
                                Re-Submit Proposal
                            </button>
                        </div>
                    )}

                    {/* Attachment Preview Bar */}
                    {attachments.length > 0 && (
                        <div className="mb-4 p-3 lg:p-4 bg-surface/80 backdrop-blur-xl border border-border/60 rounded-[32px] flex gap-3 lg:gap-4 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="relative group shrink-0">
                                    <div className="w-24 h-24 rounded-2xl bg-white border border-white/60 shadow-inner overflow-hidden flex items-center justify-center p-1">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <FileIcon size={32} className="text-plaiz-blue" />
                                                <span className="text-[9px] font-black uppercase text-muted-foreground truncate w-20 px-2 text-center">{file.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setAttachments([])}
                                        className="absolute -top-3 -right-3 w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center shadow-2xl hover:bg-rose-500 transition-all border-2 border-surface"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {isUploading && (
                                <div className="w-24 h-24 rounded-2xl bg-white/20 border border-white/10 flex items-center justify-center animate-pulse">
                                    <div className="w-10 h-10 border-4 border-plaiz-blue/20 border-t-plaiz-blue rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    )}

                    {isRecording ? (
                        <div className="glass-pill rounded-[40px] p-2 shadow-2xl border border-border/50 bg-surface/90">
                            <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
                        </div>
                    ) : (
                        <div className="flex items-end gap-3 lg:gap-6">
                            <div className="flex-1 flex items-center glass-pill px-3 lg:px-8 py-2 lg:py-3 rounded-[32px] lg:rounded-[48px] shadow-2xl border border-border/50 bg-surface/90 transition-all focus-within:ring-4 focus-within:ring-plaiz-blue/10 focus-within:border-plaiz-blue/40 min-h-[52px] lg:min-h-[72px]">
                                <div className="flex items-center gap-1 lg:gap-3 shrink-0 mr-2 lg:mr-4">
                                    <button
                                        type="button"
                                        className={`p-2 lg:p-4 transition-all rounded-full ${showEmojiPicker ? 'text-plaiz-blue bg-plaiz-blue/10' : 'text-muted-foreground/60 hover:text-plaiz-blue hover:bg-plaiz-blue/10'}`}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    >
                                        <Smile size={24} strokeWidth={2.2} />
                                    </button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                const file = e.target.files[0];
                                                if (file.size > 15 * 1024 * 1024) return alert('File is too large (max 15MB)');
                                                setAttachments([file]);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isWorkerLocked}
                                        className={`p-2 lg:p-4 transition-all rounded-full ${isWorkerLocked ? 'opacity-20 cursor-not-allowed' : 'text-muted-foreground/60 hover:text-foreground hover:bg-accent/10'}`}
                                        title={isWorkerLocked ? "Pay to unlock" : "Attach"}
                                    >
                                        <PaperclipIcon size={24} strokeWidth={2.2} />
                                    </button>

                                    {currentUserRole === 'worker' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowProposalForm(true)}
                                            className="p-2 lg:p-4 text-plaiz-blue hover:bg-plaiz-blue/10 rounded-full transition-all"
                                            title="Proposal"
                                        >
                                            <Zap size={24} strokeWidth={2.2} />
                                        </button>
                                    )}
                                </div>

                                <textarea
                                    ref={textAreaRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isChatLocked ? "Accept project to unlock chat..." : isUploading ? "Uploading file..." : "Type a message"}
                                    rows={1}
                                    disabled={isUploading || isChatLocked}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-foreground text-[16px] lg:text-[17px] font-medium py-3 lg:py-5 px-0 placeholder:text-muted-foreground/30 resize-none overflow-y-auto min-h-[32px] lg:min-h-[64px] max-h-[250px] leading-relaxed flex items-center"
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = `${Math.min(target.scrollHeight, 250)}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e as any);
                                        }
                                    }}
                                />
                            </div>

                            {newMessage.trim() || attachments.length > 0 ? (
                                <button
                                    onClick={handleSend}
                                    disabled={isSending || isUploading || isChatLocked}
                                    className="w-[52px] h-[52px] lg:w-[64px] lg:h-[64px] bg-plaiz-blue text-white rounded-[18px] lg:rounded-[24px] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-plaiz-blue/30 disabled:opacity-30 disabled:scale-100 shrink-0"
                                >
                                    {isUploading ? (
                                        <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send size={22} fill="currentColor" className="ml-0.5 lg:ml-1" />
                                    )}
                                </button>
                            ) : currentUserRole === 'worker' && ['work_started', 'review_samples'].includes(project?.status) ? (
                                <button
                                    type="button"
                                    onClick={() => setShowFinalWorkModal(true)}
                                    className="h-[52px] lg:h-[64px] px-5 lg:px-8 rounded-[18px] lg:rounded-[24px] bg-plaiz-blue text-white flex items-center justify-center gap-2 lg:gap-3 shadow-xl shadow-plaiz-blue/30 hover:scale-105 active:scale-95 transition-all shrink-0 font-black uppercase text-[10px] lg:text-[12px] tracking-widest whitespace-nowrap"
                                >
                                    <UploadCloud size={20} />
                                    <span>SUBMIT DELIVERY</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsRecording(true)}
                                    disabled={isChatLocked}
                                    className="w-[52px] h-[52px] lg:w-[64px] lg:h-[64px] rounded-[18px] lg:rounded-[24px] bg-accent/5 border border-border/50 text-muted-foreground flex items-center justify-center transition-all shrink-0 active:scale-90 hover:scale-105 hover:bg-plaiz-blue hover:text-white group disabled:opacity-20"
                                    title="Voice Note"
                                >
                                    <Mic size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Emoji Picker Overlay */}
                {showEmojiPicker && (
                    <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setShowEmojiPicker(false)} />
                        <div className="absolute bottom-[calc(100%+12px)] right-6 z-[100] animate-in slide-in-from-bottom-2 duration-300">
                            <EmojiPicker
                                theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                                onEmojiClick={(emojiData) => {
                                    setNewMessage(prev => prev + emojiData.emoji);
                                    setShowEmojiPicker(false);
                                    textAreaRef.current?.focus();
                                }}
                                lazyLoadEmojis={true}
                            />
                        </div>
                    </>
                )}
            </div>

            <FinalWorkModal
                isOpen={showFinalWorkModal}
                onClose={() => setShowFinalWorkModal(false)}
                onSubmit={async (files, heroIndex) => {
                    if (!agreement) return;
                    setIsUploading(true);
                    try {
                        const uploadedUrls = await Promise.all(
                            files.map(async (file) => {
                                const path = `final-deliveries/${projectId}/${Date.now()}-${file.name}`;
                                const { data, error } = await supabase.storage.from('attachments').upload(path, file);
                                if (error) throw error;
                                const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(data.path);
                                return { url: publicUrl, name: file.name };
                            })
                        );

                        await sendMessage('', user.id, null, false, {
                            type: 'sample_review',
                            samples: uploadedUrls
                        });

                        // Set final_file (using selected hero) and update status
                        await supabase.from('projects').update({
                            status: 'review_samples',
                            final_file: uploadedUrls.length > 0 ? (uploadedUrls[heroIndex]?.url || uploadedUrls[0].url) : null
                        }).eq('id', projectId);

                        setShowFinalWorkModal(false);
                    } catch (error) {
                        console.error('Error submitting work:', error);
                        alert('Error submitting work. Please try again.');
                    } finally {
                        setIsUploading(false);
                    }
                }}
            />

            <PaymentModal
                isOpen={showPaymentModal}
                amount={activePayment?.amount || 0}
                projectId={projectId}
                phase={activePayment?.phase}
                onClose={() => {
                    setShowPaymentModal(false);
                    setActivePayment(null);
                }}
                onSuccess={async () => {
                    if (activePayment) {
                        await handlePaymentSuccess(activePayment.phase, activePayment.amount);
                    }
                }}
            />

            <PricingProposalForm
                isOpen={showProposalForm}
                onClose={() => setShowProposalForm(false)}
                onSubmit={handleProposalSubmit}
                isPrinting={project?.skill === 'printing'}
                initialData={agreement} // Pass existing agreement for pre-filling
            />

            {/* Image Preview Modal */}
            {selectedImageUrl && createPortal(
                <div
                    className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300 backdrop-blur-sm"
                    onClick={() => setSelectedImageUrl(null)}
                >
                    <button
                        onClick={() => setSelectedImageUrl(null)}
                        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-[5001] shadow-2xl"
                    >
                        <X size={24} />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedImageUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        />
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
};

export default ProjectChat;
