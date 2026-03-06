import CTAButton from '../components/CTAButton';
import { Mail, MessageCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
    return (
        <div className="pt-32 pb-24 min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-plaiz/10 rounded-full blur-[150px] -z-10 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/30 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2" />

            <div className="max-w-4xl mx-auto px-6 w-full text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-plaiz to-blue-400">Connect</span></h1>
                    <p className="text-xl text-slate-300 mb-16 max-w-2xl mx-auto">
                        Ready to start a project? Pick how you'd like to reach us — we typically respond within 24 hours.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* WhatsApp Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="glass-dark p-10 rounded-3xl border border-white/10 flex flex-col items-center hover:bg-white/5 transition-colors"
                    >
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mb-6">
                            <MessageCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">WhatsApp</h3>
                        <p className="text-slate-400 mb-8 max-w-[200px]">The fastest way to reach us. Great for quick questions and starting a new project.</p>
                        <CTAButton type="whatsapp" text="Message Us" className="w-full" />
                    </motion.div>

                    {/* Email Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="glass-dark p-10 rounded-3xl border border-white/10 flex flex-col items-center hover:bg-white/5 transition-colors"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mb-6">
                            <Mail size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Email</h3>
                        <p className="text-slate-400 mb-8 max-w-[200px]">Prefer email? Send us your project details and we'll get back to you shortly.</p>
                        <CTAButton type="email" text="Send Email" className="w-full" />
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-16 flex items-center justify-center text-slate-400 gap-2"
                >
                    <MapPin size={18} className="text-plaiz" />
                    <span>Available Worldwide | Based in Nigeria</span>
                </motion.div>

            </div>
        </div>
    );
};

export default Contact;
