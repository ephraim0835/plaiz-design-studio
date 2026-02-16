import React, { useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface CompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onComplete: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ isOpen, onClose, projectId, onComplete }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ status: 'awaiting_final_payment' })
                .eq('id', projectId);

            if (error) throw error;

            // Also verify all deliverables are uploaded? (Optional)

            onComplete();
            onClose();
        } catch (err) {
            console.error('Error completing project:', err);
            alert('Failed to mark as complete');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-sm bg-[#0F0F1A] border border-white/10 rounded-3xl shadow-2xl p-8 text-center animate-scale-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>

                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-500">
                    <CheckCircle size={32} />
                </div>

                <h3 className="text-xl font-black text-white mb-2">Finish Project?</h3>
                <p className="text-white/60 text-sm mb-6">
                    This will fetch the client to make the **Final Payment**. <br />
                    Once paid, your files will be unlocked for download.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-green-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform"
                    >
                        {isSubmitting ? 'Updating...' : 'Mark as Complete'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white/5 text-white/60 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompletionModal;
