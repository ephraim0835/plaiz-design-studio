import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Linkedin, Github, Globe, Zap } from 'lucide-react';

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
                            <span className="font-extrabold text-2xl tracking-tight text-foreground">PLAÍZ</span>
                        </Link>
                        <p className="text-muted text-lg font-medium leading-relaxed max-w-sm">
                            Get quality designs without stress. We connect you with top-tier creatives for all your design and tech needs.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Instagram, Twitter, Linkedin, Github].map((Icon, i) => (
                                <button key={i} className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-muted hover:text-plaiz-blue hover:border-plaiz-blue transition-all shadow-sm active:scale-90">
                                    <Icon size={20} />
                                </button>
                            ))}
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
                                {['Terms of Use', 'Privacy Policy', 'Cookie Policy'].map(item => (
                                    <li key={item}><Link to="/terms" className="text-sm font-bold text-muted hover:text-plaiz-blue transition-colors">{item}</Link></li>
                                ))}
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
