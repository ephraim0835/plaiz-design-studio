import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import PortfolioGrid from '../components/PortfolioGrid';
import TestimonialsSection from '../components/TestimonialsSection';

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

            <TestimonialsSection />
        </div>
    );
};

export default Home;
