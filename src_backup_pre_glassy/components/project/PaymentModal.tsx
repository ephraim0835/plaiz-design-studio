import React, { useState } from 'react';
import { CreditCard, CheckCircle, ShieldCheck, Lock } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
    isOpen: boolean;
    amount: number;
    projectId?: string;
    phase?: 'deposit_40' | 'balance_60';
    onClose: () => void;
    onSuccess: () => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    amount,
    projectId,
    phase = 'deposit_40',
    onClose,
    onSuccess
}) => {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');

    const config = {
        reference: `PLA_${Math.floor(Math.random() * 1000000000 + 1)}`,
        email: user?.email || 'customer@plaiz.design',
        amount: Math.round(amount * 100), // Paystack expects kobo
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        metadata: {
            project_id: projectId,
            client_id: user?.id,
            custom_fields: [
                {
                    display_name: "Project ID",
                    variable_name: "project_id",
                    value: projectId
                },
                {
                    display_name: "Client ID",
                    variable_name: "client_id",
                    value: user?.id
                }
            ]
        }
    };

    const initializePayment = usePaystackPayment(config);

    const handlePaystackSuccess = async (reference: any) => {
        setStep('processing');
        setIsProcessing(true);

        try {
            // Call our secure backend to verify the payment
            const { data, error } = await supabase.functions.invoke('verify-payment', {
                body: {
                    reference: reference.reference,
                    project_id: projectId,
                    phase: phase
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            // Trigger the UI success
            await onSuccess();
            setStep('success');

            setTimeout(() => {
                onClose();
                setStep('review');
                setIsProcessing(false);
            }, 3000);

        } catch (err: any) {
            console.error('Payment Verification Error:', err);
            alert('Payment received but verification failed: ' + err.message + '. Please contact support.');
            setStep('review');
            setIsProcessing(false);
        }
    };

    const handlePaystackClose = () => {
        setIsProcessing(false);
        setStep('review');
    };

    if (!isOpen) return null;

    const handlePay = () => {
        setIsProcessing(true);
        initializePayment({
            onSuccess: handlePaystackSuccess,
            onClose: handlePaystackClose
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-[#1A1C20] rounded-[32px] overflow-hidden shadow-2xl animate-zoom-in relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#00C3FF] to-[#007AFF] p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <h3 className="text-white font-black uppercase tracking-widest text-sm relative z-10">Secure Checkout</h3>
                    <div className="mt-4 flex flex-col items-center">
                        <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Total Amount</span>
                        <span className="text-4xl font-black text-white tracking-tight mt-1">
                            ₦{amount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    {step === 'review' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-plaiz-blue shrink-0">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm text-foreground">Secure Escrow</h5>
                                    <p className="text-xs text-muted-foreground">Funds are held safely until the worker delivers the project.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handlePay}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-[#00C3FF] hover:bg-[#007AFF] text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={18} />
                                    <span>Pay Now</span>
                                </button>
                                <button onClick={onClose} className="w-full py-3 text-muted-foreground font-bold text-xs uppercase tracking-widest hover:text-foreground">
                                    Cancel
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase font-bold opacity-50">
                                <Lock size={10} />
                                <span>Encrypted by Paystack</span>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="w-16 h-16 border-4 border-accent/20 border-t-plaiz-blue rounded-full animate-spin" />
                            <p className="font-bold text-foreground text-sm animate-pulse">Processing Payment...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30 animate-bounce">
                                <CheckCircle size={32} />
                            </div>
                            <p className="font-bold text-foreground text-lg">Payment Successful!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
