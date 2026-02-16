import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import {
    CreditCard,
    DollarSign,
    Clock,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Search,
    Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Profile, Payment, Payout } from '../../types';
import LoadingScreen from '../../components/LoadingScreen';
const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
};

const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyles = () => {
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'paid':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'failed':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default:
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getIcon = () => {
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'paid':
                return <CheckCircle2 size={12} />;
            case 'pending':
                return <Clock3 size={12} />;
            case 'failed':
                return <AlertCircle size={12} />;
            default:
                return null;
        }
    };

    return (
        <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${getStatusStyles()}`}>
            {getIcon()}
            {status}
        </span>
    );
};

const PaymentsTab = () => {
    const { profile } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTransactions = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);

        try {
            if (profile.role === 'admin') {
                // Admins see everything (Payments + Payouts)
                const { data: payments } = await supabase
                    .from('payments')
                    .select('*, projects(title)')
                    .order('created_at', { ascending: false });

                const { data: payouts } = await supabase
                    .from('payouts')
                    .select('*, projects(title)')
                    .order('created_at', { ascending: false });

                const combined = [
                    ...(payments || []).map(p => ({ ...p, type: 'payment', displayType: 'Income' })),
                    ...(payouts || []).map(p => ({ ...p, type: 'payout', displayType: 'Payout' }))
                ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setTransactions(combined);
            } else if (profile.role === 'client') {
                // Clients see their payments
                const { data } = await supabase
                    .from('payments')
                    .select('*, projects(title)')
                    .eq('payer_id', profile.id)
                    .order('created_at', { ascending: false });

                setTransactions((data || []).map(p => ({ ...p, type: 'payment', displayType: 'Payment' })));
            } else {
                // Workers see their payouts
                const { data } = await supabase
                    .from('payouts')
                    .select('*, projects(title)')
                    .eq('worker_id', profile.id)
                    .order('created_at', { ascending: false });

                setTransactions((data || []).map(p => ({ ...p, type: 'payout', displayType: 'Earning' })));
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.projects?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.reference?.toLowerCase().includes(searchTerm.toLowerCase());

        const status = t.status.toLowerCase();
        let matchesFilter = filter === 'all';

        if (!matchesFilter) {
            if (filter === 'confirmed') {
                matchesFilter = status === 'confirmed' || status === 'paid';
            } else {
                matchesFilter = status === filter;
            }
        }

        return matchesSearch && matchesFilter;
    });

    const totalVolume = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    if (loading) return <LoadingScreen message="Syncing Transactions..." />;

    return (
        <DashboardLayout title="Payments">
            <div className="space-y-8 animate-fade-in pb-12">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter mb-1">
                            Payments & <span className="text-emerald-500">History</span>
                        </h2>
                        <p className="text-muted font-medium italic text-sm lg:text-base opacity-70">
                            {profile?.role === 'admin' ? 'Total Platform Volume' : 'Your personal financial ledger'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-6 py-3 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Volume</p>
                            <p className="text-xl font-black text-white">₦{totalVolume.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by project or reference..."
                            className="w-full bg-surface/30 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-surface/30 p-1 rounded-2xl border border-white/5 w-fit">
                        {['all', 'pending', 'confirmed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-300 ${filter === f
                                    ? 'bg-white/10 text-white shadow-lg'
                                    : 'text-muted hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop List View */}
                <div className="hidden md:block">
                    {filteredTransactions.length > 0 ? (
                        <div className="bg-surface/30 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-muted">Transaction Details</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-muted">Status</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-muted">Date</th>
                                        <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-muted text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((tx, idx) => (
                                        <tr
                                            key={tx.id}
                                            className={`group hover:bg-white/[0.02] transition-colors ${idx !== filteredTransactions.length - 1 ? 'border-b border-white/5' : ''
                                                }`}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${tx.type === 'payment' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                        {tx.type === 'payment' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm tracking-tight">{tx.projects?.title || 'Unknown Project'}</p>
                                                        <p className="text-[10px] font-medium text-muted uppercase tracking-wider mt-0.5">
                                                            {tx.displayType} • Ref: {tx.reference || tx.transaction_reference || tx.id.slice(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <StatusBadge status={tx.status} />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-muted">
                                                    <Clock size={14} className="opacity-50" />
                                                    <span className="text-xs font-semibold">{formatDate(new Date(tx.created_at))}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`text-lg font-black ${tx.type === 'payment' ? 'text-white' : 'text-blue-400'
                                                    }`}>
                                                    {tx.type === 'payment' ? '-' : '+'}₦{Number(tx.amount).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <NoTransactionsView />
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(tx => (
                            <div key={tx.id} className="bg-surface/30 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'payment' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {tx.type === 'payment' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{tx.projects?.title || 'Unknown Project'}</p>
                                            <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{formatDate(new Date(tx.created_at))}</p>
                                        </div>
                                    </div>
                                    <span className={`text-lg font-black ${tx.type === 'payment' ? 'text-white' : 'text-blue-400'
                                        }`}>
                                        ₦{Number(tx.amount).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <StatusBadge status={tx.status} />
                                    <p className="text-[10px] font-medium text-muted uppercase tracking-wider italic">
                                        {tx.displayType}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <NoTransactionsView />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

const NoTransactionsView = () => (
    <div className="py-24 flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-white/5 bg-surface/20 backdrop-blur-sm">
        <div className="w-20 h-20 rounded-[30px] bg-background border border-white/5 flex items-center justify-center mb-6 text-muted/30 shadow-2xl animate-pulse">
            <DollarSign size={40} />
        </div>
        <h4 className="text-white font-black text-xl mb-2 tracking-tighter uppercase">No Transactions Found</h4>
        <p className="text-muted text-sm font-medium italic opacity-60">Your financial footprint mapping is currently clear.</p>
    </div>
);

export default PaymentsTab;
