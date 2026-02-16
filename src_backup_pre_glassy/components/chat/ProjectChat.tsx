import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const audioRef = useRef<HTMLAudioElement | null>(null);

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

    const handleProposalSubmit = async (amount: number, deliverables: string, timeline: string, notes: string) => {
        try {
            const { error } = await supabase.rpc('submit_price_proposal', {
                p_project_id: projectId,
                p_worker_id: user.id,
                p_amount: amount,
                p_deliverables: deliverables,
                p_timeline: timeline,
                p_notes: notes
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
            const { error } = await supabase
                .from('agreements')
                .update({ status: 'accepted', client_agreed: true })
                .eq('id', agreement.id);

            if (error) throw error;

            // Update project status to awaiting_down_payment
            await supabase
                .from('projects')
                .update({ status: 'awaiting_down_payment' })
                .eq('id', projectId);

            // Send system message for payment
            await sendMessage(`Proposal accepted. Please pay the 40% deposit of ₦${(agreement.amount * 0.4).toLocaleString()} to begin work.`, user.id, null, false, {
                type: 'payment_request',
                phase: 'deposit_40',
                amount: agreement.amount * 0.4
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

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`flex flex-col h-[100svh] lg:h-full overflow-hidden relative transition-all duration-500 border border-border shadow-sm
            bg-background dark:bg-background/95 
            bg-[radial-gradient(circle_at_top_right,rgba(0,122,255,0.08),transparent_60%)] 
            dark:bg-[radial-gradient(circle_at_top_right,rgba(0,122,255,0.15),transparent_60%)]
            lg:rounded-2xl`}>

            <div className="h-16 lg:h-20 border-b border-border px-6 flex items-center justify-between shrink-0 z-10 shadow-sm
                bg-card dark:bg-card/40 dark:backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-accent/20 flex items-center justify-center text-plaiz-blue border border-border transition-colors">
                        <Zap size={20} className="fill-plaiz-blue/20" />
                    </div>
                    <div>
                        <h4 className="text-foreground font-extrabold text-sm lg:text-base tracking-tight">{projectTitle}</h4>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Active Now</span>
                        </div>
                    </div>
                </div>
            </div>

            <ProjectStatusTracker status={project?.status} />
            {currentUserRole === 'client' && <SafetyBanner />}

            {/* Phase 18: Client Payment Overlay */}
            {project?.status === 'pending_agreement' && agreement && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-in slide-in-from-top-4 w-full max-w-sm px-4">
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
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="max-w-6xl mx-auto p-4 lg:p-10 space-y-4">
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400/30">
                            <div className="w-20 h-20 rounded-[30px] border-2 border-dashed border-gray-200 flex items-center justify-center mb-6">
                                <Zap size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Say hello to start.</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user?.id;
                        const isRead = msg.is_read;

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-bubblepop`}>
                                <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-3 max-w-[90%] md:max-w-[75%]`}>
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-1 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`relative px-4 py-3 transition-all text-sm leading-relaxed backdrop-blur-sm
                                                        ${isMe
                                                    ? `bg-primary text-primary-foreground rounded-3xl rounded-br-sm 
                                                               shadow-[0_4px_14px_-2px_rgba(0,122,255,0.35)] dark:shadow-[0_4px_14px_-2px_rgba(0,123,255,0.45)]
                                                               ring-1 ring-primary/30 dark:ring-primary/40
                                                               bg-gradient-to-br from-primary to-primary/80`
                                                    : `text-foreground rounded-3xl rounded-bl-sm 
                                                               bg-accent/10 dark:bg-accent/20 
                                                               border border-accent/30 dark:border-accent/40
                                                               shadow-[0_2px_7px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)]
                                                               bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10
                                                               dark:backdrop-blur-sm`
                                                }`}>

                                                {msg.payload?.type === 'price_proposal' ? (
                                                    <PriceProposalCard
                                                        amount={msg.payload.amount}
                                                        deposit={msg.payload.deposit}
                                                        balance={msg.payload.balance}
                                                        notes={msg.payload.notes}
                                                        isClient={currentUserRole === 'client'}
                                                        status={agreement?.status || 'pending'}
                                                        onAccept={handleAcceptProposal}
                                                        onRequestChanges={() => alert('Feature coming soon: Requesting changes to proposal')}
                                                        {...({} as any)} // For legacy props compatibility if any
                                                    />
                                                ) : msg.payload?.type === 'payment_request' ? (
                                                    <PaymentWorkflowCard
                                                        phase={msg.payload.phase}
                                                        amount={msg.payload.amount}
                                                        isClient={currentUserRole === 'client'}
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
                                                        status={project?.status}
                                                        onApprove={handleApproveSamples}
                                                        onRequestRevision={handleRequestRevision}
                                                    />
                                                ) : msg.is_voice_note && msg.attachment_url ? (
                                                    <div className="flex items-center gap-4 min-w-[180px] py-1">
                                                        <button
                                                            onClick={() => handlePlayAudio(msg.attachment_url!, msg.id)}
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 ${isMe ? 'bg-white/20 text-white' : 'bg-background/20 text-primary'}`}
                                                        >
                                                            {playingAudioId === msg.id ? (
                                                                <Pause size={16} className="fill-current" />
                                                            ) : (
                                                                <Play size={16} className="ml-1 fill-current" />
                                                            )}
                                                        </button>
                                                        <div className={`flex-1 h-1 bg-current opacity-20 rounded-full relative overflow-hidden`}>
                                                            <div className="absolute inset-0 bg-current w-1/2" />
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Voice</span>
                                                    </div>
                                                ) : msg.attachment_url && (
                                                    <div className="mb-2 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 p-1 relative group/img">
                                                        {msg.attachment_type === 'image' ? (
                                                            <div className="relative">
                                                                <img src={msg.attachment_url} alt="" className={`max-w-full h-auto max-h-[350px] object-cover rounded-lg ${project?.status !== 'completed' && !isMe ? 'blur-[1px] grayscale-[0.3]' : ''}`} />
                                                                {project?.status !== 'completed' && !isMe && (
                                                                    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-lg">
                                                                        {/* Mesh Layer */}
                                                                        <div className="absolute inset-0 opacity-[0.2]"
                                                                            style={{
                                                                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 11px),
                                                                                                  repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 11px)`
                                                                            }}
                                                                        />
                                                                        {/* Grid Layer */}
                                                                        <div className="absolute inset-[-20%] grid grid-cols-5 grid-rows-5 gap-0 opacity-40 rotate-[-12deg]">
                                                                            {[...Array(25)].map((_, idx) => (
                                                                                <span key={idx} className="text-[8px] font-black uppercase tracking-tight text-white whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center">
                                                                                    PROPERTY OF PLAIZ
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className={`p-3 flex items-center gap-4 rounded-lg ${isMe ? 'bg-white/10' : 'bg-background/50'}`}>
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMe ? 'bg-white text-primary' : 'bg-primary text-white'} shadow-sm`}>
                                                                    <FileIcon size={20} />
                                                                </div>
                                                                <div className="flex-1 min-w-0 pr-4">
                                                                    <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-foreground'}`}>{msg.attachment_name || 'Asset'}</p>
                                                                    <p className={`text-[8px] font-black uppercase opacity-60 tracking-wider`}>Plaiz Verified</p>
                                                                </div>
                                                                {(project?.status === 'completed' || isMe || currentUserRole === 'admin') ? (
                                                                    <a href={msg.attachment_url} download className={`p-2 transition-colors ${isMe ? 'hover:text-white' : 'hover:text-primary'}`}><Download size={18} /></a>
                                                                ) : (
                                                                    <div className="p-2 opacity-30 cursor-not-allowed" title="Unlock after final payment">
                                                                        <Download size={18} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {(!msg.is_voice_note || msg.content !== 'Voice Note') && (
                                                    <p className="text-[14px] md:text-base font-medium whitespace-pre-wrap">{msg.content}</p>
                                                )}
                                            </div>

                                            <div className={`flex items-center gap-1.5 mt-1.5 px-1 font-bold ${isMe ? 'justify-end' : 'justify-start'}
                                                        text-xs opacity-50 dark:opacity-60 group/msginfo`}>
                                                <span>{formatTime(msg.created_at)}</span>
                                                {(isMe || currentUserRole === 'admin') && (
                                                    <>
                                                        {isMe && <CheckCheck size={14} className={isRead ? 'text-plaiz-cyan' : ''} />}
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="ml-1 text-red-500 hover:text-red-400 opacity-0 group-hover/msginfo:opacity-100 transition-opacity p-0.5"
                                                            title="Delete Message"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Attachment Preview Bar */}
            {attachments.length > 0 && (
                <div className="px-6 py-4 bg-background/40 backdrop-blur-md border-t border-border flex gap-4 animate-in slide-in-from-bottom-4 duration-500 overflow-x-auto scrollbar-hide">
                    {attachments.map((file, idx) => (
                        <div key={idx} className="relative group shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-white/60 shadow-sm overflow-hidden flex items-center justify-center p-1">
                                {file.type.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <FileIcon size={24} className="text-plaiz-blue" />
                                        <span className="text-[8px] font-black uppercase text-gray-400 truncate w-16 px-1">{file.name}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setAttachments([])}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-foreground text-background flex items-center justify-center shadow-lg hover:bg-rose-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {isUploading && (
                        <div className="w-20 h-20 rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center animate-pulse">
                            <div className="w-8 h-8 border-4 border-blue-50 border-t-plaiz-blue rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            )}

            {/* Premium Sticky Chat Input */}
            <div className="sticky bottom-0 bg-card border-t border-border backdrop-blur-2xl shrink-0 z-20 animate-in slide-in-from-bottom-6 duration-700">
                {isRecording ? (
                    <div className="p-4 lg:p-6 max-w-6xl mx-auto w-full">
                        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex items-center gap-3 max-w-6xl mx-auto w-full py-4 px-6 lg:px-10">
                        <div className="flex items-center gap-2">
                            {currentUserRole === 'worker' && (
                                <button
                                    type="button"
                                    onClick={() => setShowProposalForm(true)}
                                    className="p-3 text-primary hover:bg-primary/10 rounded-2xl transition-all"
                                    title="Send Pricing Proposal"
                                >
                                    <DollarSign size={22} strokeWidth={2.5} />
                                </button>
                            )}
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
                                className={`p-3 transition-all rounded-2xl ${isWorkerLocked ? 'opacity-20 cursor-not-allowed' : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'}`}
                                title={isWorkerLocked ? "Pay project price to unlock uploads" : "Attach File"}
                            >
                                <Paperclip size={22} strokeWidth={2.5} />
                            </button>
                        </div>

                        <textarea
                            ref={textAreaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isUploading ? "Uploading file..." : "Type a message..."}
                            rows={1}
                            disabled={isUploading}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-foreground text-sm lg:text-[15px] font-medium py-3 px-2 placeholder:text-muted-foreground/40 resize-none overflow-y-auto scrollbar-hide"
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 500)}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e as any);
                                }
                            }}
                        />

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={`p-3 rounded-2xl transition-all ${showEmojiPicker ? 'text-plaiz-blue bg-plaiz-blue/10' : 'text-muted-foreground hover:text-plaiz-blue hover:bg-plaiz-blue/10'}`}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                <Smile size={22} strokeWidth={2.5} />
                            </button>

                            {newMessage.trim() || attachments.length > 0 ? (
                                <button
                                    type="submit"
                                    disabled={isSending || isUploading}
                                    className="w-12 h-12 bg-plaiz-blue text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:scale-100 disabled:grayscale"
                                >
                                    {isUploading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send size={20} strokeWidth={2.5} />
                                    )}
                                </button>
                            ) : currentUserRole === 'worker' && ['work_started', 'review_samples'].includes(project?.status) ? (
                                <button
                                    type="button"
                                    onClick={() => setShowFinalWorkModal(true)}
                                    className="px-6 h-12 rounded-2xl bg-plaiz-blue text-white flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 font-black uppercase text-[9px] tracking-widest whitespace-nowrap"
                                >
                                    <UploadCloud size={18} />
                                    Submit Work
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsRecording(true)}
                                    className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center transition-all shrink-0 active:scale-90 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary-foreground shadow-sm"
                                    title="Record Voice Note"
                                >
                                    <Mic size={22} />
                                </button>
                            )}
                        </div>
                    </form>
                )}

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
            />
        </div >
    );
};

export default ProjectChat;
