import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';
import {
    X,
    Layout,
    Folder,
    MessageSquare,
    Image,
    User,
    LogOut,
    Zap,
    CreditCard,
    ChevronRight,
    Settings,
    Shield
} from 'lucide-react';

interface MobileDashboardMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileDashboardMenu: React.FC<MobileDashboardMenuProps> = ({ isOpen, onClose }) => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const role = profile?.role;
    const isSpecialist = ['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(role || '');
    const basePath = role === 'admin' ? '/admin' : isSpecialist ? '/worker' : '/client';

    const menuItems = [
        { label: 'Dashboard Home', path: basePath, icon: Layout },
        { label: 'My Projects', path: `${basePath}/projects`, icon: Folder },
        { label: 'Messages', path: `${basePath}/messages`, icon: MessageSquare },
    ];

    if (role === 'admin') {
        menuItems.push(
            { label: 'Gallery Management', path: `${basePath}/gallery`, icon: Image },
            { label: 'User Management', path: `${basePath}/users`, icon: User },
            { label: 'System Settings', path: `${basePath}/settings`, icon: Settings }
        );
    } else if (isSpecialist) {
        menuItems.push(
            { label: 'Portfolio Gallery', path: `${basePath}/gallery`, icon: Image },
            { label: 'Worker Settings', path: `${basePath}/settings`, icon: Settings }
        );
    } else {
        // Client
        menuItems.push(
            { label: 'Payment History', path: `${basePath}/payments`, icon: CreditCard },
            { label: 'Studio Portfolio', path: `${basePath}/gallery`, icon: Image }
        );
    }

    const handleSignOut = async () => {
        await signOut();
        onClose();
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-[2000] lg:hidden animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/60 backdrop-blur-3xl"
                onClick={onClose}
            />

            {/* Menu Drawer */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-surface border-t border-border rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
                {/* Header */}
                <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-card/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue border border-plaiz-blue/20 shadow-soft">
                            <Zap size={24} className="fill-current opacity-20" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground tracking-tight">Menu</h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{profile?.full_name || 'Member'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground active:scale-90 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    {menuItems.map((item, idx) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className="flex items-center justify-between p-4 rounded-2xl bg-card/30 border border-transparent hover:border-plaiz-blue/20 hover:bg-plaiz-blue/5 transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-background border border-border text-muted group-hover:text-plaiz-blue transition-colors">
                                    <item.icon size={20} />
                                </div>
                                <span className="text-[13px] font-bold text-foreground group-hover:text-plaiz-blue transition-colors">
                                    {item.label}
                                </span>
                            </div>
                            <ChevronRight size={16} className="text-muted/30 group-hover:text-plaiz-blue transition-colors" />
                        </Link>
                    ))}

                    <div className="h-4" />

                    {/* Theme & Extras */}
                    <div className="p-4 rounded-2xl bg-card/30 border border-border/50 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Appearance</span>
                            <ThemeToggle />
                        </div>
                        <div className="h-px bg-border/50" />
                        <Link
                            to="/profile"
                            onClick={onClose}
                            className="flex items-center gap-4 px-2 hover:text-plaiz-blue transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                                <User size={16} />
                            </div>
                            <span className="text-xs font-bold">Edit Profile</span>
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 bg-card/30 border-t border-border/50">
                    <button
                        onClick={handleSignOut}
                        className="w-full py-4 rounded-2xl bg-background border border-border text-red-500 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-red-500/5 hover:border-red-500/20"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                    <p className="text-center text-[9px] font-bold text-muted/30 uppercase tracking-[0.3em] mt-6">
                        Plaiz Studio &copy; 2026
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobileDashboardMenu;
