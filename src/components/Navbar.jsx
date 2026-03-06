import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Portfolio', path: '/portfolio' },
        { name: 'About', path: '/about' }
    ];

    return (
        <>
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-50">
                <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-full px-6 py-3 flex items-center justify-between border border-white/10 shadow-lg">
                    <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <img src="/logo.png" alt="PLAIZ" className="w-8 h-8 object-contain" />
                        PLAIZ STUDIO
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-plaiz ${location.pathname === link.path ? 'text-white' : 'text-slate-300'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:block">
                        <a
                            href="https://wa.me/2348145129596?text=Hello%20I%20would%20like%20to%20start%20a%20project%20with%20PLAIZ%20STUDIO"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-slate-900 hover:bg-slate-100 transition-colors px-5 py-2 rounded-full text-sm font-semibold shadow-lg"
                        >
                            Start Project
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-slate-300 hover:text-white"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Nav Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 md:hidden bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`text-2xl font-semibold transition-colors hover:text-plaiz ${location.pathname === link.path ? 'text-white' : 'text-slate-400'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <a
                            href="https://wa.me/2348145129596?text=Hello%20I%20would%20like%20to%20start%20a%20project%20with%20PLAIZ%20STUDIO"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsOpen(false)}
                            className="mt-4 bg-plaiz text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg shadow-plaiz/30"
                        >
                            Start a Project
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
