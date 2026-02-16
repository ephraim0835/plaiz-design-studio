import React, { useState, useEffect } from 'react';
import { Share, X, Download } from 'lucide-react';

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // 1. Check if already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        setIsStandalone(isStandaloneMode);
        if (isStandaloneMode) return;

        // 2. Listen for Android/Desktop install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowAndroidPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 3. Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
            // Check if it's already dismissed recently (localStorage)
            const lastDismissed = localStorage.getItem('iosPromptDismissed');
            if (!lastDismissed || Date.now() - parseInt(lastDismissed) > 86400000 * 7) { // Show once a week
                // Delay slightly to not annoy immediately
                const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
                return () => clearTimeout(timer);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleAndroidInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowAndroidPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const dismissIOS = () => {
        setShowIOSPrompt(false);
        localStorage.setItem('iosPromptDismissed', Date.now().toString());
    };

    if (isStandalone) return null;

    return (
        <>
            {/* Android / Desktop Prompt */}
            {showAndroidPrompt && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-[#0f172a] border border-white/10 p-4 rounded-2xl shadow-2xl z-[100] animate-slide-up flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                <img src="/pwa-icon.png" alt="App" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA3QkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48cGF0aCBkPSJNMTIgOGwxLjUgMy41TDExIDE1aDEyIi8+PC9zdmc+'} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Install App</h4>
                                <p className="text-xs text-white/60">Add to home screen for better experience</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAndroidPrompt(false)} className="text-white/40 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>
                    <button
                        onClick={handleAndroidInstall}
                        className="w-full py-2 bg-plaiz-blue text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> Install Now
                    </button>
                </div>
            )}

            {/* iOS Prompt */}
            {showIOSPrompt && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 z-[100] pb-[env(safe-area-inset-bottom)] animate-slide-up">
                    <div className="max-w-md mx-auto relative">
                        <button
                            onClick={dismissIOS}
                            className="absolute -top-2 right-0 text-white/40 hover:text-white p-2"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white p-2">
                                    <img src="/pwa-icon.png" alt="Icon" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Install Plaiz Studio</h3>
                                    <p className="text-xs text-white/60">Install this web app on your iPhone.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-white/80 border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2">
                                <span>1. Tap</span>
                                <Share size={18} className="text-plaiz-blue" />
                            </div>
                            <div className="h-px w-4 bg-white/20" />
                            <div className="flex items-center gap-2">
                                <span>2. Select</span>
                                <span className="font-bold bg-white/10 px-2 py-1 rounded">Add to Home Screen</span>
                            </div>
                        </div>

                        {/* Pointing Arrow at the bottom center (typically where safari bar is) */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0f172a] rotate-45 border-r border-b border-white/10" />
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
