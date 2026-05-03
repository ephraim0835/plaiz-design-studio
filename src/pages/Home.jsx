import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import PortfolioGrid from '../components/PortfolioGrid';
import TestimonialsSection from '../components/TestimonialsSection';
import CTAButton from '../components/CTAButton';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen pt-20">
            <Hero />
            <AboutSection />

            {/* Mini Portfolio Preview */}
            <section className="py-24 bg-slate-900/50 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <PortfolioGrid />
            </section>

            {/* CTA Section after Portfolio */}
            <section className="py-12 text-center px-6">
                <div className="max-w-2xl mx-auto glass-dark p-12 rounded-3xl border border-white/10">
                    <h2 className="text-3xl font-bold text-white mb-4">Have something in mind?</h2>
                    <p className="text-slate-400 mb-8">Send us a message on WhatsApp and let's get started.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <CTAButton type="whatsapp" text="Work With Me" />
                    </div>
                </div>
            </section>

            <TestimonialsSection />
        </div>
    );
};

export default Home;
