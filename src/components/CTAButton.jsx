import { motion } from 'framer-motion';
import { MessageCircle, Mail } from 'lucide-react';

const CTAButton = ({ type = 'whatsapp', text = 'Start a Project', className = '' }) => {
    const isWhatsApp = type === 'whatsapp';

    const href = isWhatsApp
        ? "https://wa.me/2348145129596?text=Hello%20I%20would%20like%20to%20start%20a%20project%20with%20PLAIZ%20STUDIO"
        : "mailto:plaiz.studio@gmail.com?subject=Start%20a%20Project%20with%20PLAIZ%20STUDIO&body=Hello,%20I%20would%20like%20to%20start%20a%20project";

    const Icon = isWhatsApp ? MessageCircle : Mail;

    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg ${isWhatsApp
                ? 'bg-plaiz text-white hover:bg-[#0057CC] shadow-plaiz/30 hover:shadow-plaiz/60'
                : 'bg-[#0F172A]/80 border border-white/10 text-slate-100 hover:bg-[#0F172A] hover:text-white hover:border-white/20'
                } ${className}`}
        >
            <Icon size={20} className={isWhatsApp ? 'animate-pulse' : ''} />
            {text}
        </motion.a>
    );
};

export default CTAButton;
