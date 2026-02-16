import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Folder, MessageSquare, Menu, Plus, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
    onMenuClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useAuth();

    const isSpecialist = ['graphic_designer', 'web_designer', 'worker', 'designer', 'developer', 'print_specialist', 'video_editor'].includes(role || '');
    const basePath = role === 'admin' ? '/admin' : isSpecialist ? '/worker' : '/client';

    const isActive = (path: string) => {
        if (path === basePath && (location.pathname === basePath || location.pathname === `${basePath}/`)) return true;
        return location.pathname.startsWith(`${basePath}/${path}`.replace('//', '/'));
    };

    const navItems = [
        {
            icon: Layout,
            label: 'Home',
            path: basePath,
            isActive: location.pathname === basePath || location.pathname === `${basePath}/`
        },
        {
            icon: Folder,
            label: 'Projects',
            path: `${basePath}/projects`,
            isActive: location.pathname.includes('/projects')
        },
        {
            icon: Plus,
            label: 'New',
            path: '/client/request',
            isAction: true,
            visible: role === 'client'
        },
        {
            icon: MessageSquare,
            label: 'Chat',
            path: `${basePath}/messages`,
            isActive: location.pathname.includes('/messages')
        },
        {
            icon: Menu,
            label: 'Menu',
            onClick: onMenuClick,
            isActive: false
        }
    ];

    return (
        <div className="lg:hidden fixed bottom-8 left-6 right-6 z-50 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-surface/80 backdrop-blur-2xl border border-border shadow-xl rounded-[32px] px-8 py-4 flex items-center justify-between">
                {navItems.map((item, index) => {
                    if (item.visible === false) return null;

                    const active = item.isActive;
                    const isAction = item.isAction;

                    if (isAction) {
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(item.path!)}
                                className="bg-plaiz-blue w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-2xl transform -translate-y-8 hover:scale-110 active:scale-95 transition-all border-4 border-background"
                            >
                                <Plus size={28} strokeWidth={3} />
                            </button>
                        )
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-90 ${active ? 'text-white bg-plaiz-blue shadow-soft' : 'text-muted hover:text-foreground'}`}
                        >
                            <item.icon size={22} strokeWidth={active ? 3 : 2} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
