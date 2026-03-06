import { motion } from 'framer-motion';
import { Sparkles, Target, Zap } from 'lucide-react';

const AboutSection = () => {
    const features = [
        {
            icon: <Sparkles className="w-8 h-8 text-plaiz" />,
            title: 'Bold, Purposeful Design',
            description: 'Every design is crafted to be visually sharp and strategically on-brand — leaving a lasting impression on anyone who sees it.'
        },
        {
            icon: <Target className="w-8 h-8 text-blue-400" />,
            title: 'Built Around You',
            description: 'We take time to understand your vision and audience before a single pixel is placed. Design with purpose, always.'
        },
        {
            icon: <Zap className="w-8 h-8 text-amber-500" />,
            title: 'Clean, On-Time Delivery',
            description: 'From brief to final file — smooth process, fast turnaround, and pixel-perfect results. Every time.'
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden" id="about">
            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Story Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                            More Than Just A <span className="text-transparent bg-clip-text bg-gradient-to-r from-plaiz to-blue-400">Design Studio</span>
                        </h2>
                        <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                            At Plaiz Studio, we believe great design is the difference between being seen and being remembered.
                            Every piece we create is intentional — built to reflect your brand, connect with your audience, and make an impact.
                        </p>
                        <p className="text-lg text-slate-300 leading-relaxed mb-8">
                            Whether you're a student launching your first idea, a small business building credibility, or a growing brand
                            ready to level up — Plaiz Studio is here to make it real.
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-4">
                                {['/clients/delicias.png', '/clients/zem.png', '/clients/ecomama.png'].map((src, i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-[#020617] bg-white flex items-center justify-center relative overflow-hidden">
                                        <img src={src} alt="Client logo" className="w-full h-full object-contain p-1.5" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm">
                                <p className="text-white font-semibold">Trusted by students, small businesses, and growing brands</p>
                                <div className="flex text-amber-400 text-xs">★★★★★</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Features Side */}
                    <div className="grid grid-cols-1 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className="bg-[#0F172A]/80 p-8 rounded-xl hover:bg-[#0F172A] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 border border-white/5 hover:border-white/20"
                            >
                                <div className="flex items-start gap-6">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 shrink-0">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                        <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default AboutSection;
