import React from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { CreditCard, DollarSign, Clock } from 'lucide-react';

const PaymentsTab = () => {
    return (
        <DashboardLayout title="Payments">
            <div className="space-y-8 animate-fade-in pb-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">Payments & Invoices</h2>
                        <p className="text-muted font-medium italic text-sm lg:text-base">Manage your transactions and billing details</p>
                    </div>
                    <button className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed">
                        <CreditCard size={18} /> Add Payment Method
                    </button>
                </div>

                <div className="py-20 flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-border bg-surface/50">
                    <div className="w-20 h-20 rounded-[30px] bg-background border border-border flex items-center justify-center mb-6 text-muted shadow-sm">
                        <DollarSign size={40} />
                    </div>
                    <h4 className="text-foreground font-black text-xl mb-2">No Transactions Yet</h4>
                    <p className="text-muted text-sm font-medium">Payment history will appear here once you start a project.</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PaymentsTab;
