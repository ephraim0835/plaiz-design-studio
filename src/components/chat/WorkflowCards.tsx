import React from 'react';
import { CheckCircle, XCircle, CreditCard, ChevronRight, Info, X, Download, Lock, Zap } from 'lucide-react';

interface PriceProposalCardProps {
    amount: number;
    deposit: number;
    balance: number;
    notes?: string;
    onAccept: () => void;
    onRequestChanges: () => void;
    isClient: boolean;
    isInBlueBubble?: boolean;
    status: string;
}

export const PriceProposalCard: React.FC<PriceProposalCardProps> = ({
    amount, deposit, balance, notes, onAccept, onRequestChanges, isClient, isInBlueBubble, status
}) => {
    const isPending = status === 'pending' || status === 'waiting_for_client';
    const isRevision = status === 'revision_requested';

    return (
        <div className="my-4 w-full max-w-sm overflow-hidden rounded-[24px] bg-[#1A6CFF] border border-white/20 shadow-2xl shadow-blue-900/40 animate-in fade-in slide-in-from-bottom-2">
            {/* Header Accent */}
            <div className="bg-white/10 px-5 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 text-white/90">
                    <Info size={14} className="text-blue-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Project Quote</span>
                </div>
                {isRevision ? (
                    <div className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap size={10} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase">Revision Requested</span>
                    </div>
                ) : !isPending && (
                    <div className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} />
                        <span className="text-[9px] font-black uppercase">Active</span>
                    </div>
                )}
            </div>

            <div className="p-6">
                <div className="mb-6">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Project Value</p>
                    <h4 className="text-white text-3xl font-black">₦{amount.toLocaleString()}</h4>
                </div>

                <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-white/50 tracking-tight">Deposit (40%)</p>
                        <p className="text-sm font-bold text-white">₦{deposit.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-white/50 tracking-tight">Balance (60%)</p>
                        <p className="text-sm font-bold text-white">₦{balance.toLocaleString()}</p>
                    </div>
                </div>

                {notes && (
                    <div className="mb-6 p-3 bg-blue-400/10 rounded-xl border border-white/5">
                        <p className="text-[11px] text-white/70 leading-relaxed italic">"{notes}"</p>
                    </div>
                )}

                {isClient && isPending && (
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onAccept}
                            className="flex-1 py-4 bg-white text-[#1A6CFF] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={14} />
                            Accept Quote
                        </button>
                        <button
                            onClick={onRequestChanges}
                            className="flex-1 py-4 bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                            <XCircle size={14} />
                            Revision
                        </button>
                    </div>
                )}

                {isRevision && (
                    <div className="py-2 flex items-center justify-center gap-3 text-white border-t border-white/10 pt-4">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Zap size={18} className="animate-pulse" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em]">Awaiting Updated Quote...</span>
                    </div>
                )}

                {!isPending && !isRevision && (
                    <div className="py-2 flex items-center justify-center gap-3 text-white border-t border-white/10 pt-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CheckCircle size={18} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em]">Agreement Signed & Active</span>
                    </div>
                )}
            </div>
        </div>
    );
};

interface PaymentWorkflowCardProps {
    phase: 'deposit_40' | 'balance_60';
    amount: number;
    onPay: () => void;
    isClient: boolean;
    isInBlueBubble?: boolean;
    isPaid: boolean;
}

export const PaymentWorkflowCard: React.FC<PaymentWorkflowCardProps> = ({
    phase, amount, onPay, isClient, isInBlueBubble, isPaid
}) => {
    const isDeposit = phase === 'deposit_40';

    return (
        <div className={`my-4 w-full max-w-sm rounded-[24px] overflow-hidden border ${isPaid ? 'bg-[#1A6CFF] border-white/20' : 'bg-[#2A2D35] border-white/10'} shadow-2xl animate-in zoom-in-95 duration-300`}>
            {/* Status Accent Strip */}
            <div className={`h-1.5 w-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />

            <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {isPaid ? (
                                <div className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                    <CheckCircle size={10} />
                                    <span className="text-[9px] font-black uppercase">Confirmed</span>
                                </div>
                            ) : (
                                <div className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                    <Info size={10} />
                                    <span className="text-[9px] font-black uppercase">Pending</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mt-2">
                            {isPaid ? 'Payment Received' : (isDeposit ? 'Deposit Payment' : 'Final Balance')}
                        </p>
                        <h4 className="text-2xl font-black tracking-tight text-white">₦{amount.toLocaleString()}</h4>
                    </div>
                    <div className={`p-3 rounded-2xl ${isPaid ? 'bg-white/10 text-white' : 'bg-amber-500/20 text-amber-500'}`}>
                        <CreditCard size={24} />
                    </div>
                </div>

                {isClient && !isPaid && (
                    <button
                        onClick={onPay}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 group"
                    >
                        Secure Checkout
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                )}

                {!isClient && !isPaid && (
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest italic leading-none">
                            Awaiting client settlement...
                        </p>
                    </div>
                )}

                {isPaid && (
                    <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl border border-white/10">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Transaction Complete</p>
                            <p className="text-white/50 text-[10px] uppercase font-black tracking-tighter">Funds verified & secured</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface SampleReviewCardProps {
    samples: { url: string; name: string }[];
    onApprove: () => void;
    onRequestRevision: () => void;
    isClient: boolean;
    isInBlueBubble?: boolean;
    status: string;
}

export const SampleReviewCard: React.FC<SampleReviewCardProps> = ({
    samples, onApprove, onRequestRevision, isClient, isInBlueBubble, status
}) => {
    const isUnderReview = status === 'review_samples';
    const [activePreview, setActivePreview] = React.useState<{ url: string; name: string } | null>(null);
    const [isDownloading, setIsDownloading] = React.useState<string | null>(null);

    const handleForcedDownload = async (url: string, filename: string) => {
        try {
            setIsDownloading(url);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        } finally {
            setIsDownloading(null);
        }
    };

    return (
        <div className="my-4 w-full max-w-sm rounded-[24px] overflow-hidden bg-[#1D2129] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-2">
            {/* Header Accent Strip */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 flex items-center gap-3">
                <Info size={14} className="text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Work Samples for Review</span>
            </div>

            <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    {samples.map((sample, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(sample.url) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(sample.name);
                        const extension = sample.name.split('.').pop()?.toUpperCase() || 'FILE';

                        return (
                            <div
                                key={idx}
                                className="relative aspect-square rounded-[20px] overflow-hidden bg-white/5 group cursor-zoom-in flex items-center justify-center border border-white/10 hover:border-white/30 transition-all"
                                onClick={() => setActivePreview(sample)}
                            >
                                {isImage ? (
                                    <>
                                        <img src={sample.url} alt={sample.name} className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${status !== 'completed' ? 'blur-[0.2px]' : ''}`} />
                                        {status !== 'completed' && (
                                            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                                                <div className="absolute inset-0 opacity-[0.2]"
                                                    style={{
                                                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.2) 12px, rgba(255,255,255,0.2) 13px)`
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {status === 'completed' && isClient && (
                                            <button
                                                className="absolute bottom-2 right-2 p-2 bg-black/60 text-white rounded-lg hover:bg-plaiz-blue backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-xl"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleForcedDownload(sample.url, sample.name);
                                                }}
                                            >
                                                {isDownloading === sample.url ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : <Download size={14} />}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                                            <span className="text-[12px] font-black">{extension}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {status === 'completed' ? (
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Project Completed!</p>
                            <p className="text-white/50 text-[10px] leading-relaxed uppercase font-black tracking-tight">Full access granted</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Lock size={16} className="text-amber-500" />
                            <p className="text-[10px] text-white/50 leading-relaxed font-bold uppercase tracking-widest italic">
                                Preview Mode — Files unlock after final payment
                            </p>
                        </div>
                    </div>
                )}

                {isClient && isUnderReview && (
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onApprove}
                            className="flex-1 py-4 bg-plaiz-blue text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Approve
                        </button>
                        <button
                            onClick={onRequestRevision}
                            className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-white transition-all border border-white/10"
                        >
                            Revision
                        </button>
                    </div>
                )}

                {status === 'awaiting_final_payment' && (
                    <div className="py-2 flex items-center justify-center gap-3 text-emerald-400 border-t border-white/10 pt-4">
                        <CheckCircle size={18} />
                        <span className="text-[11px] font-black uppercase tracking-widest">Samples Approved</span>
                    </div>
                )}
            </div>

            {/* Lightbox Preview Modal */}
            {activePreview && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-300"
                    onClick={() => setActivePreview(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-4 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all z-[110] border border-white/20 shadow-2xl group flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); setActivePreview(null); }}
                        aria-label="Close Preview"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div
                        className="relative max-w-[95vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl Select-none bg-card"
                        onClick={(e) => e.stopPropagation()}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(activePreview.url) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(activePreview.name) ? (
                            <>
                                <img
                                    src={activePreview.url}
                                    alt={activePreview.name}
                                    className={`max-w-full max-h-[85vh] object-contain select-none ${status !== 'completed' ? 'blur-[0.5px]' : ''}`}
                                    onContextMenu={(e) => e.preventDefault()}
                                    onDragStart={(e) => e.preventDefault()}
                                />

                                {/* Persistent Watermark Layer - Only show if not completed */}
                                {status !== 'completed' && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                                        {/* Mesh Layer for Lightbox */}
                                        <div className="absolute inset-0 opacity-[0.2]"
                                            style={{
                                                backgroundImage: `repeating-linear-gradient(30deg, transparent, transparent 30px, rgba(255,255,255,0.3) 30px, rgba(255,255,255,0.3) 31px),
                                                                repeating-linear-gradient(120deg, transparent, transparent 30px, rgba(255,255,255,0.3) 30px, rgba(255,255,255,0.3) 31px)`
                                            }}
                                        />
                                        {/* Ultra Dense Text Grid */}
                                        <div className="grid grid-cols-6 md:grid-cols-10 grid-rows-12 gap-x-1 gap-y-16 md:gap-x-4 md:gap-y-20 opacity-40 rotate-[-25deg] scale-[1.3]">
                                            {[...Array(120)].map((_, i) => (
                                                <span key={i} className="text-[10px] md:text-[16px] font-black uppercase tracking-[0.15em] text-white whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
                                                    PROPERTY OF PLAIZ STUDIO
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-[80vw] h-[60vh] flex flex-col items-center justify-center gap-6 p-12 text-center">
                                <div className="w-24 h-24 rounded-[32px] bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue border border-plaiz-blue/20 shadow-inner">
                                    <span className="text-2xl font-black">{activePreview.name.split('.').pop()?.toUpperCase()}</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{activePreview.name}</h3>
                                    <p className="text-muted-foreground text-sm font-medium">Non-previewable delivery</p>
                                </div>
                            </div>
                        )}

                        {/* Additional Protection Overlay - Only if not completed */}
                        {status !== 'completed' && (
                            <div className="absolute inset-0 bg-transparent cursor-default" onContextMenu={(e) => e.preventDefault()} />
                        )}
                    </div>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center space-y-3">
                        {status !== 'completed' ? (
                            <>
                                <p className="text-white/60 text-[10px] uppercase font-black tracking-widest">PREVIEW MODE — FILES UNLOCK AFTER FINAL PAYMENT</p>
                                <p className="text-white/40 text-[9px]">High quality files are protected during review</p>
                            </>
                        ) : (
                            <>
                                <p className="text-emerald-400 text-[10px] uppercase font-black tracking-widest">HIGH QUALITY UNLOCKED</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleForcedDownload(activePreview.url, activePreview.name);
                                    }}
                                    disabled={!!isDownloading}
                                    className="px-8 py-3 bg-plaiz-blue text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/40 flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isDownloading === activePreview.url ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                    <span>{isDownloading === activePreview.url ? 'Downloading...' : 'Download to Device'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

