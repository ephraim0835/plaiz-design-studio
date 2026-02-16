import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../dashboard/BottomNav';
import { Search, Bell } from 'lucide-react';

interface MobileLayoutProps {
    children: React.ReactNode;
    title?: string;
    showSearch?: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, title, showSearch = false }) => {
    const { profile, role } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 transition-colors duration-300">
            {/* Mobile Top Bar (Notion Style) */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md z-40 px-4 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center border border-border"
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="text-sm font-bold text-foreground">{profile?.full_name?.[0] || 'U'}</div>
                        )}
                    </button>
                    {title && <h1 className="text-lg font-bold text-foreground">{title}</h1>}
                </div>

                <div className="flex items-center gap-3">
                    {showSearch && (
                        <button className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-muted">
                            <Search size={20} />
                        </button>
                    )}
                    <button className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-muted relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-plaiz-coral rounded-full border-2 border-surface" />
                    </button>
                </div>
            </header>

            {/* Sidebar Drawer removed in favor of Top-Nav unification */}


            {/* Main Content Area */}
            <main className="pt-20 px-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
            </main>

            {/* Floating Navigation */}
            <BottomNav onMenuClick={() => setIsMenuOpen(true)} />
        </div>
    );
};

export default MobileLayout;
