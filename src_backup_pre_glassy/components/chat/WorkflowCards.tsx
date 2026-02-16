import React from 'react';
import { CheckCircle, XCircle, CreditCard, ChevronRight, Info, X, Download } from 'lucide-react';

interface PriceProposalCardProps {
    amount: number;
    deposit: number;
    balance: number;
    notes?: string;
    onAccept: () => void;
    onRequestChanges: () => void;
    isClient: boolean;
    status: string;
}

export const PriceProposalCard: React.FC<PriceProposalCardProps> = ({
    amount, deposit, balance, notes, onAccept, onRequestChanges, isClient, status
}) => {
    const isPending = status === 'pending' || status === 'waiting_for_client';

    return (
        <div className="my-4 w-full max-w-sm overflow-hidden rounded-[24px] bg-white dark:bg-[#1A1C20] border border-accent/20 dark:border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gradient-to-r from-plaiz-blue to-plaiz-cyan p-4">
                <div className="flex items-center gap-2 text-white/90 mb-1">
                    <Info size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Project Quote</span>
                </div>
                <h4 className="text-white text-xl font-black">₦{amount.toLocaleString()}</h4>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tight">Deposit (40%)</p>
                        <p className="text-sm font-bold">₦{deposit.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tight">Balance (60%)</p>
                        <p className="text-sm font-bold">₦{balance.toLocaleString()}</p>
                    </div>
                </div>

                {notes && (
                    <div className="p-3 bg-accent/5 dark:bg-white/5 rounded-xl border border-accent/10 dark:border-white/5">
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">"{notes}"</p>
                    </div>
                )}

                {isClient && isPending && (
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={onAccept}
                            className="flex-1 py-3 bg-plaiz-blue text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={14} />
                            Accept
                        </button>
                        <button
                            onClick={onRequestChanges}
                            className="flex-1 py-3 bg-accent/10 text-muted-foreground rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 transition-all flex items-center justify-center gap-2"
                        >
                            <XCircle size={14} />
                            Revision
                        </button>
                    </div>
                )}

                {!isPending && (
                    <div className="py-2 flex items-center justify-center gap-2 text-emerald-500">
                        <CheckCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Quote Approved</span>
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
    isPaid: boolean;
}

export const PaymentWorkflowCard: React.FC<PaymentWorkflowCardProps> = ({
    phase, amount, onPay, isClient, isPaid
}) => {
    const isDeposit = phase === 'deposit_40';

    return (
        <div className={`my-4 w-full max-w-sm rounded-[24px] border ${isPaid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'} p-5 animate-in zoom-in-95 duration-300`}>
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isPaid ? 'Payment Received' : (isDeposit ? 'Initial Payment' : 'Final Payment')}
                    </p>
                    <h4 className="text-lg font-black tracking-tight">₦{amount.toLocaleString()}</h4>
                </div>
                <div className={`p-2 rounded-xl ${isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                    <CreditCard size={20} />
                </div>
            </div>

            {isClient && !isPaid && (
                <button
                    onClick={onPay}
                    className="w-full py-4 bg-foreground dark:bg-white text-background dark:text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 group"
                >
                    Pay Now
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            )}

            {!isClient && !isPaid && (
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest text-center opacity-60 italic">
                    Awaiting client payment...
                </p>
            )}

            {isPaid && (
                <div className="flex items-center gap-2 text-emerald-500">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Payment Complete</span>
                </div>
            )}
        </div>
    );
};

interface SampleReviewCardProps {
    samples: { url: string; name: string }[];
    onApprove: () => void;
    onRequestRevision: () => void;
    isClient: boolean;
    status: string;
}

export const SampleReviewCard: React.FC<SampleReviewCardProps> = ({
    samples, onApprove, onRequestRevision, isClient, status
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
            // Fallback to opening in new tab
            window.open(url, '_blank');
        } finally {
            setIsDownloading(null);
        }
    };

    return (
        <div className="my-4 w-full max-w-sm rounded-[24px] bg-white dark:bg-[#1A1C20] border border-accent/20 dark:border-white/10 shadow-xl overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4">
                <div className="flex items-center gap-2 text-white/90 mb-1">
                    <Info size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Work Samples for Review</span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {samples.map((sample, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(sample.url) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(sample.name);
                        const extension = sample.name.split('.').pop()?.toUpperCase() || 'FILE';

                        return (
                            <div
                                key={idx}
                                className="relative aspect-square rounded-xl overflow-hidden bg-accent/10 group cursor-zoom-in flex items-center justify-center border border-accent/5"
                                onClick={() => setActivePreview(sample)}
                            >
                                {isImage ? (
                                    <>
                                        <img src={sample.url} alt={sample.name} className={`w-full h-full object-cover ${status !== 'completed' ? 'blur-[0.2px]' : ''}`} />
                                        {/* Nuclear Watermark Overlay - Only show if not completed */}
                                        {status !== 'completed' && (
                                            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                                                {/* Mesh Layer */}
                                                <div className="absolute inset-0 opacity-[0.25]"
                                                    style={{
                                                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.3) 12px, rgba(255,255,255,0.3) 13px),
                                                                        repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.3) 12px, rgba(255,255,255,0.3) 13px)`
                                                    }}
                                                />
                                                {/* Dense Text Grid */}
                                                <div className="absolute inset-[-50%] grid grid-cols-5 grid-rows-5 items-center justify-center gap-0 opacity-40 rotate-[-25deg]">
                                                    {[...Array(25)].map((_, i) => (
                                                        <span key={i} className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                                            PROPERTY OF PLAIZ
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Download Trigger for Completed Projects */}
                                        {status === 'completed' && isClient && (
                                            <button
                                                className="absolute bottom-2 right-2 p-2 bg-black/60 text-white rounded-lg hover:bg-plaiz-blue backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-xl"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleForcedDownload(sample.url, sample.name);
                                                }}
                                                title="Download File"
                                            >
                                                {isDownloading === sample.url ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Download size={14} />
                                                )}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue border border-plaiz-blue/20">
                                            <span className="text-[12px] font-black">{extension}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate w-full px-1">
                                            {sample.name}
                                        </span>
                                        {status === 'completed' && isClient && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleForcedDownload(sample.url, sample.name);
                                                }}
                                                className="mt-1 text-[8px] font-black text-plaiz-blue uppercase tracking-widest border border-plaiz-blue/20 px-2 py-1 rounded-full hover:bg-plaiz-blue hover:text-white transition-all flex items-center gap-1"
                                            >
                                                {isDownloading === sample.url ? (
                                                    <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <span>Download</span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {status === 'completed' ? (
                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2">
                        <div className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                                <CheckCircle size={12} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Project Completed!</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    High-quality files are now unlocked. Tap any file to preview or use the download buttons to save them.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        You can preview the work above with a protective watermark. Approve to unlock high-quality files.
                    </p>
                )}

                {isClient && isUnderReview && (
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={onApprove}
                            className="flex-1 py-3 bg-plaiz-blue text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                        >
                            Approve
                        </button>
                        <button
                            onClick={onRequestRevision}
                            className="flex-1 py-3 bg-accent/10 text-muted-foreground rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold"
                        >
                            Revision
                        </button>
                    </div>
                )}

                {status === 'awaiting_final_payment' && (
                    <div className="py-2 flex items-center justify-center gap-2 text-emerald-500">
                        <CheckCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Samples Approved</span>
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
                                <p className="text-white/60 text-[10px] uppercase font-black tracking-widest">PREVIEW MODE</p>
                                <p className="text-white/40 text-[9px]">High quality files unlock after payment</p>
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

