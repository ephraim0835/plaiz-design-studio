import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const AVATAR_COLORS = [
    'bg-plaiz/20 text-plaiz',
    'bg-blue-500/20 text-blue-400',
    'bg-amber-500/20 text-amber-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-purple-500/20 text-purple-400',
    'bg-rose-500/20 text-rose-400',
];

const TestimonialsSection = () => {
    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        const fetchTestimonials = async () => {
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .eq('published', true)
                .order('order', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                setTestimonials([]);
            } else {
                setTestimonials(data.slice(0, 6));
            }
        };

        fetchTestimonials();
    }, []);

    if (testimonials.length === 0) return null;

    return (
        <section className="py-24 bg-slate-900/50 relative border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">What Clients Say</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="glass-dark p-8 rounded-2xl text-left border border-white/10 hover:border-white/20 transition-colors"
                        >
                            {/* Stars */}
                            {t.stars > 0 && (
                                <div className="flex text-amber-400 text-sm mb-4 tracking-widest">
                                    {'★'.repeat(Math.min(t.stars, 5))}
                                </div>
                            )}

                            {/* Review */}
                            <p className="text-slate-300 leading-relaxed mb-6 italic">
                                "{t.review}"
                            </p>

                            {/* Client */}
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                                    {t.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold text-sm">{t.name}</h4>
                                    <span className="text-slate-500 text-xs tracking-wide">{t.role}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <p className="text-slate-600 text-sm mt-10">
                    More client feedback coming soon as we complete new projects.
                </p>
            </div>
        </section>
    );
};

export default TestimonialsSection;
