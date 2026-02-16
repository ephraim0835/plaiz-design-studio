import React, { useState } from 'react';
import { DollarSign, FileText, X, CheckCircle } from 'lucide-react';

interface PricingProposalFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number, deliverables: string, timeline: string, notes: string) => Promise<void>;
}

const PricingProposalForm: React.FC<PricingProposalFormProps> = ({ isOpen, onClose, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [deliverables, setDeliverables] = useState('');
    const [notes, setNotes] = useState('');
    const [timeline, setTimeline] = useState('7 Days');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(Number(amount), deliverables, timeline, notes);
            onClose();
        } catch (error) {
            console.error('Proposal failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-[40px] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.8)] flex flex-col animate-zoom-in overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-plaiz-blue via-plaiz-cyan to-plaiz-blue animate-gradient-x opacity-50" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all z-20"
                >
                    <X size={20} />
                </button>

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
                    {/* Scrollable Content */}
                    <div className="p-8 lg:p-12 overflow-y-auto">
                        <div className="w-20 h-20 bg-plaiz-cyan/10 rounded-[24px] flex items-center justify-center mb-8 text-plaiz-cyan border border-plaiz-cyan/20 shadow-glow">
                            <DollarSign size={40} />
                        </div>

                        <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">Submit Project Price</h3>
                        <p className="text-muted text-base font-medium mb-10">Define your terms and start the project.</p>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Grand Total (₦)</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-bold group-focus-within:text-plaiz-cyan transition-colors">₦</span>
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-2xl py-5 pl-12 pr-6 text-foreground text-lg font-bold focus:border-plaiz-cyan focus:ring-4 focus:ring-plaiz-cyan/10 outline-none transition-all placeholder:text-muted/20"
                                        placeholder="e.g. 50000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Scope of Work (Deliverables)</label>
                                <textarea
                                    required
                                    value={deliverables}
                                    onChange={(e) => setDeliverables(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-2xl py-5 px-6 text-foreground text-sm font-medium focus:border-plaiz-cyan focus:ring-4 focus:ring-plaiz-cyan/10 outline-none transition-all h-28 resize-none placeholder:text-muted/20"
                                    placeholder="e.g. 1. Logo Concepts (3)&#10;2. Final Vector Files&#10;3. Brand Guidelines"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Worker Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-2xl py-5 px-6 text-foreground text-sm font-medium focus:border-plaiz-cyan focus:ring-4 focus:ring-plaiz-cyan/10 outline-none transition-all h-24 resize-none placeholder:text-muted/20"
                                    placeholder="Any additional details for the client..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Delivery Timeline</label>
                                <div className="relative">
                                    <select
                                        value={timeline}
                                        onChange={(e) => setTimeline(e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-2xl py-5 px-6 text-foreground text-sm font-bold focus:border-plaiz-cyan outline-none appearance-none cursor-pointer pr-12"
                                    >
                                        <option value="3 Days">3 Days (Express)</option>
                                        <option value="7 Days">7 Days (Standard)</option>
                                        <option value="14 Days">14 Days (Extended)</option>
                                        <option value="30 Days">30 Days (Production)</option>
                                        <option value="Custom">Custom Timeline</option>
                                    </select>
                                    <CheckCircle size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted/30 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 lg:p-10 border-t border-border bg-surface/50 backdrop-blur-md flex flex-col sm:flex-row gap-4 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-8 border border-border text-muted rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] hover:bg-background hover:text-foreground transition-all order-2 sm:order-1"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-4 px-8 bg-plaiz-cyan text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hove:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-plaiz-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 order-1 sm:order-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Submit Proposal</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PricingProposalForm;
