import React from 'react';

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Syncing Workspace...' }) => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-muted/10 border-t-plaiz-blue rounded-full animate-spin shadow-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-plaiz-blue rounded-full animate-pulse" />
                </div>
            </div>
            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.6em] text-muted/60 animate-pulse">{message}</p>
        </div>
    );
};

export default LoadingScreen;
