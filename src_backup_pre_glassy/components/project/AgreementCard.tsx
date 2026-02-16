import React, { useState } from 'react';
import { CheckCircle, XCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AgreementCardProps {
    agreement: any;
    currentUserRole: string; // 'client' | 'worker' | 'admin'
    projectStatus?: string;
    onUpdate: () => void;
    onReject?: () => void;
}

const AgreementCard: React.FC<AgreementCardProps> = ({ agreement, currentUserRole, projectStatus, onUpdate, onReject }) => {
    const [loading, setLoading] = useState(false);

    const handleAction = async (action: 'accept' | 'reject') => {
        setLoading(true);
        try {
            // Update Agreement
            const updates: any = {};
            if (currentUserRole === 'client') updates.client_agreed = (action === 'accept');
            if (currentUserRole === 'worker') updates.freelancer_agreed = (action === 'accept');

            const { error } = await supabase
                .from('agreements')
                .update(updates)
                .eq('id', agreement.id);

            if (error) throw error;

            // Logic: If THIS action made both true, trigger RPC
            const newClientState = currentUserRole === 'client' ? (action === 'accept') : agreement.client_agreed;
            const newWorkerState = currentUserRole === 'worker' ? (action === 'accept') : agreement.freelancer_agreed;

            if (newClientState && newWorkerState) {
                // Both agreed -> Trigger RPC to lock it and update project status
                const { error: rpcError } = await supabase.rpc('confirm_agreement', { p_agreement_id: agreement.id });
                if (rpcError) console.error('Error confirming agreement:', rpcError);
            }

            onUpdate();
        } catch (err) {
            console.error('Error updating agreement:', err);
            alert('Failed to update agreement.');
        } finally {
            setLoading(false);
        }
    };

    // Determine Status display
    const isFullyAccepted = agreement.client_agreed && agreement.freelancer_agreed;
    const isAwaitingPayment = isFullyAccepted && projectStatus === 'pending_agreement';

    return (
        <div className={`w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl my-2 
            ${isAwaitingPayment
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-900/20 border-amber-500/30'
                : isFullyAccepted
                    ? 'bg-gradient-to-br from-green-500/10 to-emerald-900/20 border-green-500/30'
                    : 'bg-[#151725]'}`}>

            {/* Header */}
            <div className={`px-6 py-4 border-b border-white/5 flex items-center justify-between
                ${isAwaitingPayment
                    ? 'bg-amber-500/20'
                    : isFullyAccepted
                        ? 'bg-green-500/20'
                        : 'bg-white/5'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                        <FileText size={16} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">Proposal</h4>
                        <p className={`text-[10px] uppercase tracking-widest ${isAwaitingPayment ? 'text-amber-400' : 'text-white/50'}`}>
                            {isAwaitingPayment ? 'Awaiting Payment' : (isFullyAccepted ? 'Accepted' : 'Review')}
                        </p>
                    </div>
                </div>
                {isAwaitingPayment ? (
                    <Loader2 className="text-amber-400 animate-spin" size={20} />
                ) : (
                    isFullyAccepted && <CheckCircle className="text-green-400" size={20} />
                )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                <div className="flex items-end justify-between">
                    <div className="text-left">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Total</p>
                        <p className="text-3xl font-black text-white">₦{agreement.amount?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Timeline</p>
                        <div className="px-3 py-1 bg-white/5 rounded-lg text-white text-xs font-bold border border-white/10">
                            {agreement.timeline}
                        </div>
                    </div>
                </div>

                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Deliverables</p>
                    <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                        {agreement.deliverables}
                    </p>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-2 pt-2">
                    <StatusBadge label="Freelancer" agreed={agreement.freelancer_agreed} />
                    <ArrowRight size={12} className="text-white/20" />
                    <StatusBadge label="Client" agreed={agreement.client_agreed} />
                </div>

                {/* Actions */}
                {!isFullyAccepted && !loading && (
                    <div className="pt-2">
                        {currentUserRole === 'client' && !agreement.client_agreed ? (
                            <div className="flex gap-3">
                                <button onClick={() => onReject?.()} className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-500/20 transition-all">
                                    Decline
                                </button>
                                <button onClick={() => handleAction('accept')} className="flex-[2] py-3 bg-plaiz-cyan text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-plaiz-cyan/20">
                                    Accept Proposal
                                </button>
                            </div>
                        ) : currentUserRole === 'worker' && !agreement.freelancer_agreed ? (
                            <button onClick={() => handleAction('accept')} className="w-full py-3 bg-plaiz-cyan text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform">
                                Confirm Proposal
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-white/5 text-white/40 rounded-xl font-bold uppercase text-xs tracking-widest text-center border border-dashed border-white/10">
                                Pending
                            </div>
                        )}
                    </div>
                )}

                {/* Resilience: Show Pay button if accepted but stuck (Project status is still pending) */}
                {isFullyAccepted && currentUserRole === 'client' && !loading && (
                    <div className="pt-2 animate-in fade-in slide-in-from-bottom-2">
                        <button onClick={onUpdate} className="w-full py-3 bg-gradient-to-r from-plaiz-blue to-plaiz-cyan text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                            <span>Complete Payment</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </button>
                    </div>
                )}
                {loading && (
                    <div className="w-full py-3 flex items-center justify-center text-white/40">
                        <Loader2 className="animate-spin" size={20} />
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ label, agreed }: { label: string, agreed: boolean }) => (
    <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border ${agreed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
        <span className="text-[10px] font-bold uppercase">{label}</span>
        {agreed ? <CheckCircle size={12} /> : <div className="w-3 h-3 rounded-full border-2 border-current opacity-30" />}
    </div>
);

export default AgreementCard;
