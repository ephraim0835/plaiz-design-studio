
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, Save, Building2, Search } from 'lucide-react';

interface Bank {
    name: string;
    code: string;
    active: boolean;
}

const BankDetailsSection: React.FC = () => {
    const { user } = useAuth();
    const [verifying, setVerifying] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [account, setAccount] = useState({
        bank_code: '',
        bank_name: '',
        account_number: '',
        account_name: '',
        is_verified: false
    });

    const FALLBACK_BANKS: Bank[] = [
        { name: 'Access Bank', code: '044', active: true },
        { name: 'Citibank Nigeria', code: '023', active: true },
        { name: 'Carbon', code: '565', active: true },
        { name: 'Ecobank Nigeria', code: '050', active: true },
        { name: 'Fairmoney Microfinance Bank', code: '51318', active: true },
        { name: 'Fidelity Bank', code: '070', active: true },
        { name: 'First Bank of Nigeria', code: '011', active: true },
        { name: 'First City Monument Bank', code: '214', active: true },
        { name: 'Globus Bank', code: '00103', active: true },
        { name: 'Guaranty Trust Bank', code: '058', active: true },
        { name: 'Heritage Bank', code: '030', active: true },
        { name: 'Jaiz Bank', code: '301', active: true },
        { name: 'Keystone Bank', code: '082', active: true },
        { name: 'Kuda Bank', code: '50211', active: true },
        { name: 'MoMo PSB', code: '120003', active: true },
        { name: 'Moniepoint MFB', code: '090405', active: true },
        { name: 'OPay (Paycom)', code: '999992', active: true },
        { name: 'PalmPay', code: '999991', active: true },
        { name: 'Polaris Bank', code: '076', active: true },
        { name: 'PremiumTrust Bank', code: '105', active: true },
        { name: 'Providus Bank', code: '101', active: true },
        { name: 'Smartcash PSB', code: '120004', active: true },
        { name: 'Stanbic IBTC Bank', code: '221', active: true },
        { name: 'Standard Chartered Bank', code: '068', active: true },
        { name: 'Sterling Bank', code: '232', active: true },
        { name: 'TAJBank', code: '302', active: true },
        { name: 'Titan Bank', code: '102', active: true },
        { name: 'Union Bank of Nigeria', code: '032', active: true },
        { name: 'United Bank For Africa', code: '033', active: true },
        { name: 'Unity Bank', code: '215', active: true },
        { name: 'VFD Microfinance Bank', code: '566', active: true },
        { name: 'Wema Bank', code: '035', active: true },
        { name: 'Zenith Bank', code: '057', active: true },
    ];

    const fetchBanks = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('verify-bank-account', {
                body: { action: 'list_banks' }
            });
            if (error) {
                console.error('Edge function error:', error);
                throw error;
            }
            if (data && Array.isArray(data) && data.length > 0) {
                setBanks(data);
                setFilteredBanks(data);
            } else {
                console.warn('No banks returned from API, using fallback');
                setBanks(FALLBACK_BANKS);
                setFilteredBanks(FALLBACK_BANKS);
            }
        } catch (err) {
            console.error('Failed to fetch banks, using fallback:', err);
            setBanks(FALLBACK_BANKS);
            setFilteredBanks(FALLBACK_BANKS);
        }
    };

    const fetchExistingAccount = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('worker_id', user.id)
                .single();

            if (data) {
                setAccount({
                    bank_code: data.bank_code,
                    bank_name: data.bank_name,
                    account_number: data.account_number,
                    account_name: data.account_name,
                    is_verified: data.is_verified
                });
                setSearchTerm(data.bank_name);
            }
        } catch (err) {
            // No account found
        }
    };

    useEffect(() => {
        fetchBanks();
        fetchExistingAccount();
    }, [user]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredBanks(banks.filter(b =>
                b.name.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else {
            setFilteredBanks(banks);
        }
    }, [searchTerm, banks]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBankSelect = (bank: Bank) => {
        setAccount({ ...account, bank_code: bank.code, bank_name: bank.name, is_verified: false, account_name: '' });
        setSearchTerm(bank.name);
        setShowDropdown(false);
    };

    const handleVerifyAndSave = async (overrideNum?: string) => {
        const accountNumber = overrideNum || account.account_number;
        if (!account.bank_code || !accountNumber) {
            setError('Please select a bank and enter account number');
            return;
        }

        console.log('Attempting verification for:', { bank_code: account.bank_code, account_number: accountNumber });
        setVerifying(true);
        setError(null);
        setSuccess(null);

        try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-bank-account', {
                body: {
                    action: 'verify_account',
                    bank_code: account.bank_code,
                    account_number: accountNumber
                }
            });

            if (verifyError) {
                console.error('Supabase Function Error:', verifyError);
                throw new Error(verifyError.message || 'Failed to reach verification service');
            }

            if (!verifyData || verifyData.error) {
                console.error('Paystack Data Error:', verifyData);
                throw new Error(verifyData?.error || 'Verification failed. Please check details.');
            }

            console.log('Verification Success:', verifyData);
            const verifiedName = verifyData.account_name;

            const { error: dbError } = await supabase
                .from('bank_accounts')
                .upsert({
                    worker_id: user.id,
                    bank_name: account.bank_name,
                    bank_code: account.bank_code,
                    account_number: accountNumber,
                    account_name: verifiedName,
                    recipient_code: verifyData.recipient_code,
                    is_verified: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'worker_id' });

            if (dbError) throw dbError;

            setAccount(prev => ({
                ...prev,
                account_number: accountNumber,
                account_name: verifiedName,
                is_verified: true
            }));
            setSuccess('Bank account verified and saved successfully!');

        } catch (err: any) {
            console.error('Detailed Verification Error:', err);
            setError(err.message || 'Verification failed. This usually means the backend is unreachable.');
            setAccount(prev => ({ ...prev, is_verified: false, account_name: '' }));
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="bg-surface border border-border rounded-[24px] p-8 shadow-soft animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Payout Details</h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Verified Bank Account</p>
                </div>
                {account.is_verified && (
                    <div className="ml-auto px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-black text-muted/50 uppercase tracking-widest ml-1">Bank Name</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/30 z-10" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search for your bank..."
                            className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            disabled={verifying}
                        />
                        {showDropdown && filteredBanks.length > 0 && (
                            <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-background border border-border rounded-xl shadow-xl scrollbar-thin scrollbar-thumb-muted scrollbar-track-background">
                                {filteredBanks.map(bank => (
                                    <button
                                        key={bank.code}
                                        onClick={() => handleBankSelect(bank)}
                                        className="w-full text-left px-4 py-3 hover:bg-surface text-sm font-medium text-foreground transition-colors border-b border-border last:border-0"
                                    >
                                        {bank.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted/50 uppercase tracking-widest ml-1">Account Number</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/30 font-black tracking-widest text-[10px]">NUBAN</div>
                        <input
                            type="text"
                            maxLength={10}
                            value={account.account_number}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setAccount({ ...account, account_number: val, is_verified: false, account_name: '' });
                                if (val.length === 10) {
                                    // Trigger verification after a short delay
                                    setTimeout(() => handleVerifyAndSave(val), 500);
                                }
                            }}
                            placeholder="0123456789"
                            className="w-full bg-background border border-border rounded-xl py-3 pl-20 pr-4 text-sm font-black tracking-widest text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            disabled={verifying}
                        />
                    </div>
                </div>

                <div className="p-4 bg-background border border-border rounded-xl min-h-[60px] flex items-center justify-between">
                    <div>
                        <label className="text-[8px] font-black text-muted/30 uppercase tracking-widest block mb-1">Account Name</label>
                        <p className={`text-sm font-black uppercase tracking-tight ${account.account_name ? 'text-foreground' : 'text-muted/20'}`}>
                            {account.account_name || '---'}
                        </p>
                    </div>
                    {verifying && <Loader2 className="animate-spin text-emerald-500" size={20} />}
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                        <CheckCircle2 size={14} />
                        {success}
                    </div>
                )}

                <button
                    onClick={() => handleVerifyAndSave()}
                    disabled={verifying || !account.bank_code || !account.account_number || account.account_number.length < 10}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {verifying ? 'Verifying...' : (account.is_verified ? 'Update Account' : 'Verify & Save')}
                    {!verifying && <Save size={16} />}
                </button>
            </div>
        </div>
    );
};

export default BankDetailsSection;
