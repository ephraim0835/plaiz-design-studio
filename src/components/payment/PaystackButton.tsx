
import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { paymentService } from '../../services/paymentService';

interface PaystackButtonProps {
    email: string;
    amount: number;
    projectId: string;
    type: 'down_payment' | 'final_payment';
    onSuccess: (reference: string) => void;
    onError: (error: any) => void;
}

const PaystackButton: React.FC<PaystackButtonProps> = ({ email, amount, projectId, type, onSuccess, onError }) => {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const metadata = {
                project_id: projectId,
                payment_type: type
            };

            const response: any = await paymentService.initiatePayment(email, amount, metadata);

            if (response && response.status === 'success') {
                await paymentService.confirmPaymentInDB(projectId, amount, type, response.reference);
                onSuccess(response.reference);
            } else {
                throw new Error('Payment was not successful');
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            onError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-plaiz-blue text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
        >
            {loading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <CreditCard size={20} />
            )}
            {type === 'down_payment' ? 'Pay Down Payment (40%)' : 'Pay Remaining (60%)'}
        </button>
    );
};

export default PaystackButton;
