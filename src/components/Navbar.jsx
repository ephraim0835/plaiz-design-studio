import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { Menu, X, ArrowRight, Zap, User, Layout } from 'lucide-react';

const Navbar = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Services', path: '/#services' },
        { label: 'Work', path: '/portfolio' },
        { label: 'About', path: '/about' },
    ];

    const isDashboard = location.pathname.startsWith('/client') ||
        location.pathname.startsWith('/worker') ||
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/profile');

    if (isDashboard) return null; // Dashboards have their own sidebar/nav

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[1000] px-6 py-6 transition-all duration-700 ${scrolled ? 'py-4' : 'py-8'}`}>
            <div className={`max-w-5xl mx-auto flex items-center justify-between px-6 py-3 transition-all duration-500
                ${scrolled
                    ? 'bg-surface/80 backdrop-blur-md border border-border !rounded-pill px-8 py-3'
                    : 'bg-surface/40 backdrop-blur-sm border border-border rounded-3xl'}`}>

                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <img src="/plaiz-logo.png" alt="Plaiz Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-black text-lg tracking-tight text-foreground">PLAÍZ STUDIO</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-10">
                    <div className="flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                to={link.path}
                                className="text-[11px] font-bold text-foreground hover:text-plaiz-blue transition-colors uppercase tracking-[0.15em] relative group/link"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-plaiz-blue transition-all group-hover/link:w-full" />
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 pl-8 border-l border-[var(--border-color)]">
                        <ThemeToggle />
                        {user ? (
                            <Link to="/dashboard" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-plaiz-blue hover:opacity-70 transition-all">
                                <User size={14} /> My Account
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-foreground hover:text-plaiz-blue transition-colors">Sign In</Link>
                                <Link to="/register">
                                    <button className="px-6 py-2.5 bg-plaiz-blue text-white !rounded-pill text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-blue-500/20">
                                        Join <ArrowRight size={12} />
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden w-10 h-10 rounded-full bg-[var(--card-bg)] flex items-center justify-center text-primary active:scale-90 transition-all border border-[var(--border-color)]"
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Premium Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 top-0 left-0 w-full h-screen bg-[var(--bg-primary)]/95 backdrop-blur-3xl z-[900] md:hidden animate-in fade-in slide-in-from-top duration-700">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-plaiz-blue/20 blur-[120px] rounded-full animate-float" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-plaiz-coral/10 blur-[120px] rounded-full animate-float-delayed" />

                    <div className="flex flex-col items-center justify-between h-full pt-32 pb-20 px-8 relative z-10">
                        <div className="flex flex-col items-center gap-8 w-full">
                            {navLinks.map((link, idx) => (
                                <Link
                                    key={link.label}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className="group flex items-center gap-6 w-full max-w-xs p-6 rounded-[28px] bg-[var(--card-bg)]/40 border border-[var(--border-color)] hover:border-plaiz-blue/50 transition-all animate-in slide-in-from-bottom-8 overflow-hidden"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center text-plaiz-blue group-hover:bg-plaiz-blue group-hover:text-white transition-all shadow-soft overflow-hidden">
                                        {link.label === 'Services' ? <Zap size={24} /> : link.label === 'Work' ? <Layout size={24} /> : <User size={24} />}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{link.label}</p>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Explore {link.label.toLowerCase()}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="w-full max-w-xs flex flex-col gap-6 animate-in slide-in-from-bottom-12 duration-1000">
                            <div className="h-px w-full bg-[var(--border-color)] opacity-50" />

                            <div className="flex items-center justify-between px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Theme</span>
                                <ThemeToggle />
                            </div>

                            <div className="flex flex-col gap-3">
                                {user ? (
                                    <Link to="/client" onClick={() => setIsOpen(false)} className="w-full">
                                        <button className="w-full py-5 bg-plaiz-blue text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                            My Account
                                        </button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/register" onClick={() => setIsOpen(false)} className="w-full">
                                            <button className="w-full py-5 bg-plaiz-blue text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-sm h-16">
                                                Get Started
                                            </button>
                                        </Link>
                                        <Link to="/login" onClick={() => setIsOpen(false)} className="w-full py-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-[24px] font-black text-[10px] uppercase tracking-widest text-center active:scale-95 transition-all h-16 flex items-center justify-center translate-y-2">
                                            Sign In
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navbar Brand in center top */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                            <img src="/plaiz-logo.png" alt="Plaiz Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-[var(--text-primary)]">PLAÍZ STUDIO</span>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-10 right-8 w-12 h-12 rounded-2xl bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center active:scale-90 transition-all shadow-soft z-50"
                    >
                        <X size={24} />
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
