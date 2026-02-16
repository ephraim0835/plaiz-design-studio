import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Zap } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-surface pt-24 pb-12 px-6 lg:px-12 border-t border-border relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-20">
                    {/* Brand Info */}
                    <div className="lg:col-span-5 space-y-8">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6">
                                <img src="/plaiz-logo.png" alt="Plaiz Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-extrabold text-2xl tracking-tight text-foreground text-nowrap">PLAÍZ STUDIO</span>
                        </Link>
                        <p className="text-muted text-lg font-medium leading-relaxed max-w-sm">
                            Get quality designs without stress. We connect you with top-tier creatives for all your design and tech needs.
                        </p>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://www.tiktok.com/@plaizstudio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-muted hover:text-[#000000] hover:border-[#000000] dark:hover:text-white dark:hover:border-white transition-all shadow-sm active:scale-90"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5 fill-current"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13-.08-.26-.17-.38-.26v6.51a8.13 8.13 0 0 1-5.23 7.72 8.13 8.13 0 0 1-9.72-3.37c-.36-.57-.64-1.2-.82-1.85-.75-2.52-.16-5.4 1.55-7.44a8.08 8.08 0 0 1 7.25-3.32v4.02a4.11 4.11 0 0 0-3.3 4.14 4.11 4.11 0 0 0 7.85 1.48c.19-.54.21-1.12.21-1.7V8.53a8.1 8.1 0 0 1-3.41-3.41c-.48-.96-.73-2-.72-3.07V.02z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Company</h4>
                            <ul className="space-y-4">
                                {['About Us', 'How it works', 'Success Stories', 'Join Experts'].map(item => (
                                    <li key={item}><Link to="#" className="text-sm font-bold text-muted hover:text-plaiz-blue transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Design Hub</h4>
                            <ul className="space-y-4">
                                {['Graphic Design', 'Web Design', 'Printing Services'].map(item => (
                                    <li key={item}><Link to="#" className="text-sm font-bold text-muted hover:text-plaiz-blue transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Legal</h4>
                            <ul className="space-y-4">
                                <li><Link to="/terms" className="text-sm font-bold text-muted hover:text-plaiz-blue transition-colors">Terms of Use</Link></li>
                                <li><Link to="/privacy" className="text-sm font-bold text-muted hover:text-plaiz-blue transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/cookies" className="text-sm font-bold text-muted hover:text-plaiz-blue transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 text-[11px] font-bold text-muted uppercase tracking-widest">
                        <span>© 2026 PLAÍZ STUDIO</span>
                        <div className="hidden md:block w-1 h-1 rounded-full bg-border" />
                        <span>All Designs Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                            <Globe size={14} />
                            <span>Global HQ • Lagos, NG</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Soft decorative glow */}
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-100/50 blur-[100px] rounded-full" />
        </footer>
    );
};

export default Footer;
