import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';
import { Bell, Search, Layout, Folder, MessageSquare, Image, User, LogOut, ChevronRight, Zap, CreditCard, Check } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const TopNav: React.FC = () => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showNotifications, setShowNotifications] = React.useState(false);

    const role = profile?.role;
    const isSpecialist = ['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(role || '');
    const basePath = role === 'admin' ? '/admin' : isSpecialist ? '/worker' : '/client';

    const getNavItems = () => {
        const items = [
            { label: 'Home', path: basePath, icon: Layout },
            { label: 'Projects', path: `${basePath}/projects`, icon: Folder },
            { label: 'Messages', path: `${basePath}/messages`, icon: MessageSquare },
        ];

        if (role === 'admin') {
            items.push(
                { label: 'Users', path: `${basePath}/users`, icon: User },
                { label: 'Settings', path: `${basePath}/settings`, icon: CreditCard }
            );
        } else if (isSpecialist) {
            items.push(
                { label: 'Gallery', path: `${basePath}/gallery`, icon: Image },
                { label: 'Settings', path: `${basePath}/settings`, icon: CreditCard }
            );
        } else {
            // Client
            items.push(
                { label: 'Payments', path: `${basePath}/payments`, icon: CreditCard },
                { label: 'Portfolio', path: `${basePath}/gallery`, icon: Image }
            );
        }

        return items;
    };

    const navItems = getNavItems();

    const isActive = (path: string) => {
        if (path === basePath) return location.pathname === basePath || location.pathname === `${basePath}/`;
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-surface/80 backdrop-blur-xl border-b border-border z-[1000] px-12 items-center justify-between shadow-soft">
            {/* Logo Section */}
            <div className="flex items-center gap-16">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                        <img src="/plaiz-logo.png" alt="Plaiz Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-extrabold text-lg tracking-tight text-foreground uppercase">Plaiz</span>
                </Link>

                {/* Main Nav */}
                <div className="flex items-center gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 px-6 py-3 rounded-xl
                                ${isActive(item.path)
                                    ? 'bg-plaiz-blue/10 text-plaiz-blue border border-plaiz-blue/20'
                                    : 'text-muted hover:text-foreground hover:bg-background'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Right Group */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                    <Link to="/" className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-muted hover:text-foreground hover:border-foreground transition-all mr-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Website</span>
                    </Link>
                    <button className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted hover:text-foreground transition-all shadow-soft active:scale-90">
                        <Search size={18} />
                    </button>
                    <ThemeToggle />
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative active:scale-90
                                ${showNotifications ? 'bg-plaiz-blue text-white shadow-lg' : 'bg-background border border-border text-muted hover:text-foreground shadow-soft'}`}
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-plaiz-coral rounded-full border-2 border-surface shadow-sm" />
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-card overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-5 border-b border-border flex items-center justify-between bg-background/50">
                                        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => markAllAsRead()}
                                                className="text-[9px] text-plaiz-blue font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
                                            >
                                                <Check size={14} /> Clear All
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">No notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                                    className={`p-5 border-b border-border/50 hover:bg-background/50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-plaiz-blue/5' : ''}`}
                                                >
                                                    <div className="flex gap-4">
                                                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${!notif.is_read ? 'bg-plaiz-coral' : 'bg-muted/20'}`} />
                                                        <div>
                                                            <h4 className={`text-xs mb-1 ${!notif.is_read ? 'text-foreground font-bold' : 'text-muted font-medium'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <p className="text-[11px] text-muted leading-relaxed line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="h-6 w-px bg-border" />

                {/* Profile Cluster */}
                <div className="relative group/profile">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 p-1.5 pr-4 rounded-xl border border-border bg-surface hover:bg-background hover:border-muted/20 transition-all shadow-soft active:scale-[0.98]"
                    >
                        <div className="w-8 h-8 rounded-lg bg-plaiz-blue/10 overflow-hidden border border-plaiz-blue/20 flex items-center justify-center">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <span className="text-[10px] font-bold text-plaiz-blue">{profile?.full_name?.[0] || 'U'}</span>
                            )}
                        </div>
                        <div className="text-left hidden xl:block">
                            <p className="text-[10px] font-bold text-foreground leading-none">{profile?.full_name?.split(' ')[0] || 'Member'}</p>
                            <p className="text-[7px] font-bold text-muted uppercase tracking-widest mt-1">Verified Expert</p>
                        </div>
                    </button>

                    {/* Simple Clean Dropdown */}
                    <div className="absolute top-full right-0 mt-3 w-56 bg-surface border border-border rounded-xl shadow-card opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible group-hover/profile:translate-y-0 translate-y-2 transition-all p-3 z-[200]">
                        <Link to="/profile" className="flex items-center justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-plaiz-blue hover:bg-plaiz-blue/10 rounded-lg transition-all group/item border border-transparent hover:border-plaiz-blue/20">
                            <span className="flex items-center gap-3"><User size={16} /> My Profile</span>
                            <ChevronRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-all" />
                        </Link>
                        <div className="h-px bg-border my-2 mx-2" />
                        <button
                            onClick={signOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-plaiz-coral hover:bg-plaiz-coral/10 rounded-lg transition-all border border-transparent hover:border-plaiz-coral/20"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TopNav;
