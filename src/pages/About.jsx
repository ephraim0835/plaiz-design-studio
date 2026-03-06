import AboutSection from '../components/AboutSection';
import TestimonialsSection from '../components/TestimonialsSection';
import CTAButton from '../components/CTAButton';

const About = () => {
    return (
        <div className="pt-32 min-h-screen">
            <div className="text-center max-w-4xl mx-auto px-6 mb-16">
                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">The <span className="text-transparent bg-clip-text bg-gradient-to-r from-plaiz to-blue-400">Studio</span></h1>
                <p className="text-xl text-slate-300">
                    Plaiz Studio is an independent creative studio dedicated to building brands that stand out — one design at a time.
                </p>
            </div>

            <AboutSection />

            <TestimonialsSection />

            <section className="py-24 text-center px-6">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to start your project?</h2>
                    <CTAButton type="whatsapp" text="Start a Project" />
                </div>
            </section>
        </div>
    );
};

export default About;
