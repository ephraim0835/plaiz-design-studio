import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Payout } from '../../types';
import { Banknote, CheckCircle2, Clock, ExternalLink, AlertCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PayoutWithDetails extends Payout {
    projects: {
        title: string;
    };
    profiles: {
        full_name: string;
        avatar_url: string;
    };
    bank_accounts: {
        bank_name: string;
        account_number: string;
        account_name: string;
    }[];
}

const AdminPayoutsTab: React.FC = () => {
    const [payouts, setPayouts] = useState<PayoutWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [view, setView] = useState<'pending' | 'history'>('pending');

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('payouts')
                .select(`
                    *,
                    projects (title),
                    profiles:worker_id (full_name, avatar_url),
                    bank_accounts:worker_id (bank_name, account_number, account_name)
                `)
                .order('created_at', { ascending: false });

            if (view === 'pending') {
                query = query.eq('status', 'awaiting_payment');
            } else {
                query = query.in('status', ['payment_sent', 'payment_verified', 'completed']);
            }

            const { data, error } = await query;

            if (error) throw error;
            setPayouts(data as any || []);
        } catch (err) {
            console.error('Error fetching payouts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [view]);

    const handleMarkAsSent = async (payoutId: string) => {
        if (!confirm('Confirm that you have manually transferred the funds?')) return;
        setProcessingId(payoutId);
        try {
            const { error } = await supabase.rpc('mark_payout_as_sent', { payout_id: payoutId });
            if (error) throw error;
            fetchPayouts(); // Refresh list
        } catch (err: any) {
            alert('Error updating payout: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-foreground">
                        {view === 'pending' ? 'Pending Payouts' : 'Payout History'}
                    </h2>
                    <p className="text-muted text-sm font-medium">
                        {view === 'pending' ? 'Manage and process worker payments.' : 'View past transactions and records.'}
                    </p>
                </div>

                <div className="flex bg-surface border border-border rounded-xl p-1">
                    <button
                        onClick={() => setView('pending')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all
                            ${view === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all
                            ${view === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-surface rounded-3xl animate-pulse border border-border" />
                    ))}
                </div>
            ) : payouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-surface border border-border rounded-[40px] text-center">
                    <div className="w-20 h-20 rounded-3xl bg-background flex items-center justify-center mb-6 text-muted/20">
                        <Banknote size={32} />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">All Caught Up!</h3>
                    <p className="text-muted font-medium max-w-md">
                        {view === 'pending'
                            ? "There are no pending payouts needing your attention right now."
                            : "No payout history found."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {payouts.map((payout) => {
                        const bank = payout.bank_accounts?.[0];
                        return (
                            <div key={payout.id} className="group bg-surface hover:bg-surface/80 border border-border rounded-[32px] p-8 transition-all hover:shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-plaiz-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-plaiz-blue/10 transition-all" />

                                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
                                    {/* Project & Worker Info */}
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg
                                            ${payout.status === 'awaiting_payment'
                                                ? 'bg-gradient-to-br from-plaiz-blue to-indigo-600'
                                                : 'bg-emerald-500/20 text-emerald-500'}`}>
                                            {payout.status === 'awaiting_payment' ? <Banknote size={24} /> : <CheckCircle2 size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-foreground mb-1">{payout.projects?.title || 'Unknown Project'}</h3>
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={payout.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${payout.profiles?.full_name}&background=random`}
                                                    className="w-5 h-5 rounded-full object-cover border border-background"
                                                />
                                                <span className="text-sm font-bold text-muted">{payout.profiles?.full_name}</span>
                                                <span className="text-xs text-muted/40">•</span>
                                                <span className="text-xs font-mono text-muted/60">{new Date(payout.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financials & Bank */}
                                    <div className="flex flex-wrap gap-8 items-center bg-background/50 p-4 rounded-2xl border border-border/50">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1">Amount Due</span>
                                            <span className="text-2xl font-black text-foreground">₦{(payout.amount * 0.60).toLocaleString()}</span>
                                            <span className="text-[10px] text-muted ml-1 font-bold">(60%)</span>
                                        </div>
                                        <div className="h-8 w-px bg-border hidden sm:block" />
                                        {bank ? (
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1">Transfer To</span>
                                                <div className="text-sm font-bold text-foreground">{bank.bank_name}</div>
                                                <div className="text-xs font-mono text-muted">{bank.account_number}</div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-2 rounded-lg">
                                                <AlertCircle size={14} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">No Bank Info</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 w-full lg:w-auto">
                                        <Link
                                            to={`/project/${payout.project_id}`}
                                            className="px-4 py-3 rounded-xl border border-border hover:bg-background text-muted hover:text-foreground transition-all"
                                            title="View Project Details"
                                        >
                                            <ExternalLink size={20} />
                                        </Link>

                                        {view === 'pending' ? (
                                            <button
                                                onClick={() => handleMarkAsSent(payout.id)}
                                                disabled={!!processingId || !bank}
                                                className="flex-1 lg:flex-none px-6 py-3 bg-plaiz-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-plaiz-blue/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 whitespace-nowrap"
                                            >
                                                {processingId === payout.id ? (
                                                    <Clock className="animate-spin" size={16} />
                                                ) : (
                                                    <CheckCircle2 size={16} />
                                                )}
                                                Mark as Sent
                                            </button>
                                        ) : (
                                            <div className={`px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2
                                                ${payout.status === 'payment_verified'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                                {payout.status === 'payment_verified' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                {payout.status.replace('_', ' ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminPayoutsTab;
