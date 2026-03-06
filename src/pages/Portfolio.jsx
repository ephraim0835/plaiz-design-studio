import PortfolioGrid from '../components/PortfolioGrid';
import CTAButton from '../components/CTAButton';

const Portfolio = () => {
    return (
        <div className="pt-32 min-h-screen">
            <div className="text-center max-w-3xl mx-auto px-6 mb-12">
                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-plaiz to-blue-400">Portfolio</span></h1>
                <p className="text-xl text-slate-300">
                    A selection of our recent work — logos, flyers, packaging, social graphics, and more.
                </p>
            </div>

            <PortfolioGrid />

            <section className="py-24 text-center px-6">
                <div className="max-w-2xl mx-auto glass-dark p-12 rounded-3xl border border-white/10">
                    <h2 className="text-3xl font-bold text-white mb-4">Have something in mind?</h2>
                    <p className="text-slate-400 mb-8">Send us a message on WhatsApp and let's get started.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <CTAButton type="whatsapp" text="Start a Project" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Portfolio;
