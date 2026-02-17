import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Zap } from 'lucide-react';

const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up">
            <div className="bg-surface/90 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] shadow-2xl flex flex-col gap-4 max-w-[340px]">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest">
                                {needRefresh ? 'Update Available' : 'Ready Offline'}
                            </h4>
                            <p className="text-white/40 text-[10px] font-medium leading-relaxed">
                                {needRefresh
                                    ? 'A new version of Plaiz Studio is ready. Refresh to see the latest changes.'
                                    : 'App is ready to work offline. You can access it anytime.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={close}
                        className="p-1.5 text-white/20 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="w-full py-3.5 bg-plaiz-blue text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-plaiz-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={14} /> Refresh Site Now
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReloadPrompt;
