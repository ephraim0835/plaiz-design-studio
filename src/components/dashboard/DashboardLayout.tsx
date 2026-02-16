import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import MobileDashboardMenu from './MobileDashboardMenu';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
    hideBottomNav?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, hideBottomNav = false }) => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-700">
            {/* Unified Top Navigation */}
            <TopNav />

            {/* Main Content Area */}
            <div className="pt-20 lg:pt-24 transition-all duration-500">
                <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10 pb-32 lg:pb-10">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            {!hideBottomNav && <BottomNav onMenuClick={() => setIsMenuOpen(true)} />}

            {/* Mobile Menu Overlay */}
            <MobileDashboardMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />

            {/* Premium Decorative Lighting (centralized aesthetic) */}
            <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-plaiz-blue/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed top-40 -left-20 w-64 h-64 bg-plaiz-cyan/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
    );
};

export default DashboardLayout;
