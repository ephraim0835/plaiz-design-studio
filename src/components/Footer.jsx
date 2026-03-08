import { Link } from 'react-router-dom';
import { Instagram, ArrowUpRight } from 'lucide-react';

const TikTokIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-24 border-t border-white/10 bg-[#020617] pt-16 pb-8 overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-plaiz/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/30 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2" />

            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
                    <div className="md:col-span-2">
                        <Link to="/" className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 mb-6">
                            <img src="/logo.png" alt="PLAIZ STUDIO" className="w-10 h-10 object-contain drop-shadow-[0_4px_16px_rgba(0,114,255,0.3)]" />
                            PLAIZ STUDIO
                        </Link>
                        <p className="text-slate-400 max-w-sm text-lg leading-relaxed">
                            Bold design for brands that mean business. Logos, flyers, packaging, and more.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Navigation</h4>
                        <ul className="space-y-4">
                            {['Home', 'Portfolio', 'About'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                                        className="text-slate-400 hover:text-plaiz transition-colors inline-flex items-center gap-1 group"
                                    >
                                        {item}
                                        <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Legal</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/terms" className="text-slate-400 hover:text-plaiz transition-colors inline-flex items-center gap-1 group">
                                    Terms of Service
                                    <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-slate-400 hover:text-plaiz transition-colors inline-flex items-center gap-1 group">
                                    Privacy Policy
                                    <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Connect</h4>
                        <div className="flex space-x-4">
                            <a href="https://www.instagram.com/plaiz.studio?igsh=MXNuYWJvc21xZTVsOA==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-plaiz/20 hover:border-plaiz/50 transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="https://www.tiktok.com/@plaiz.studio?_r=1&_d=ehde4379548kd5&sec_uid=MS4wLjABAAAAqMaWcmLFfPVX6lx1tRNvtmJ33YQ5DQM2J3poIBDwXqrhhHgkXPaot7cCzwxrqSoF&share_author_id=7613334716284879892&sharer_language=en&source=h5_m&u_code=f2996e2cekagcf&timestamp=1772797919&user_id=7613334716284879892&sec_user_id=MS4wLjABAAAAqMaWcmLFfPVX6lx1tRNvtmJ33YQ5DQM2J3poIBDwXqrhhHgkXPaot7cCzwxrqSoF&item_author_type=1&utm_source=copy&utm_campaign=client_share&utm_medium=android&share_iid=7606610240909592341&share_link_id=ccedb827-fdbd-4da7-85f2-33b003881ef6&share_app_id=1233&ugbiz_name=ACCOUNT&ug_btm=b8727%2Cb7360&social_share_type=5&enable_checksum=1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0F172A] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-plaiz/20 hover:border-plaiz/50 transition-all">
                                <TikTokIcon size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
                    <p>© {currentYear} PLAIZ STUDIO. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
