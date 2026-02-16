
import { supabase } from '../lib/supabaseClient';

const PAYSTACK_PUBLIC_KEY = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY;
const RESEND_API_KEY = (import.meta as any).env.VITE_RESEND_API_KEY;

export const paymentService = {
    async sendEmailReceipt(email: string, amount: number, type: string, reference: string) {
        console.log(`Sending email receipt to ${email} for ${amount} (${type}). Reference: ${reference}`);
        // Integration with Resend or a Supabase Edge Function would go here
        // For now, it's a confirmed hook for the system logic.
    },

    calculateSplits(totalAmount: number) {
        return {
            downPayment: Math.round(totalAmount * 0.4),
            remainingBalance: Math.round(totalAmount * 0.6),
            workerPayout: Math.round(totalAmount * 0.8),
            platformFee: Math.round(totalAmount * 0.2),
        };
    },

    async initiatePayment(email: string, amount: number, metadata: any) {
        // This usually integrates with a Paystack popup or redirect
        // Return a promise that resolves when payment is verified
        return new Promise((resolve, reject) => {
            const handler = (window as any).PaystackPop.setup({
                key: PAYSTACK_PUBLIC_KEY,
                email: email,
                amount: Math.round(amount * 100), // Kobo
                currency: 'NGN',
                metadata: metadata,
                callback: (response: any) => {
                    resolve(response);
                },
                onClose: () => {
                    reject(new Error('Transaction was not completed, window closed.'));
                }
            });
            handler.openIframe();
        });
    },

    async processPayout(projectId: string, workerId: string, amount: number, platformFee: number, recipientCode: string) {
        const { data, error } = await supabase.functions.invoke('paystack-payouts', {
            body: {
                project_id: projectId,
                worker_id: workerId,
                amount,
                platform_fee: platformFee,
                recipient_code: recipientCode
            }
        });

        if (error) throw error;
        return data;
    },

    async confirmPaymentInDB(projectId: string, amount: number, type: 'down_payment' | 'final_payment', reference: string) {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('payments').insert({
            project_id: projectId,
            payer_id: user?.id,
            amount: amount,
            payment_type: type,
            status: 'confirmed',
            reference: reference
        });

        if (error) throw error;

        // Update Project Status
        let nextStatus: string;
        if (type === 'down_payment') {
            nextStatus = 'in_progress';
        } else {
            nextStatus = 'completed';
        }

        const { error: updateError } = await supabase.from('projects').update({
            status: nextStatus,
            payment_status: type === 'down_payment' ? 'paid_and_held' : 'full_payment_received'
        }).eq('id', projectId);

        if (updateError) throw updateError;

        // Automatic Payout Logic for Final Payment
        if (type === 'final_payment') {
            try {
                const { data: project } = await supabase
                    .from('projects')
                    .select('*, profiles:worker_id(*)')
                    .eq('id', projectId)
                    .single();

                const { data: bankData } = await supabase
                    .from('bank_accounts')
                    .select('recipient_code')
                    .eq('worker_id', project.worker_id)
                    .single();

                if (project && bankData?.recipient_code) {
                    const { data: agreement } = await supabase
                        .from('agreements')
                        .select('amount')
                        .eq('project_id', projectId)
                        .single();

                    if (!agreement) throw new Error('No agreement found for project');

                    const splits = this.calculateSplits(agreement.amount);

                    // 1. Record Payout as Pending
                    const { data: payout, error: payoutError } = await supabase
                        .from('payouts')
                        .insert({
                            project_id: projectId,
                            worker_id: project.worker_id,
                            amount: splits.workerPayout,
                            platform_fee: splits.platformFee,
                            status: 'pending'
                        })
                        .select()
                        .single();

                    if (payoutError) throw payoutError;

                    // 2. Trigger Paystack Transfer (Edge Function)
                    const payoutResponse = await this.processPayout(
                        projectId,
                        project.worker_id,
                        splits.workerPayout,
                        splits.platformFee,
                        bankData.recipient_code
                    );

                    // 3. Update Payout Status on Success
                    if (payoutResponse?.success) {
                        await supabase.from('payouts')
                            .update({
                                status: 'paid',
                                transaction_reference: payoutResponse.worker_transfer.reference,
                                payout_date: new Date().toISOString()
                            })
                            .eq('id', payout.id);

                        await supabase.from('projects')
                            .update({ status: 'payout_completed' })
                            .eq('id', projectId);
                    }
                }
            } catch (payoutErr) {
                console.error('Automatic payout failed:', payoutErr);
            }
        }
    }
};
