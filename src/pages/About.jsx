import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Target, Lightbulb, TrendingUp, Users } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-background min-h-screen selection:bg-plaiz-blue/10 selection:text-plaiz-blue overflow-x-hidden relative transition-colors duration-700">
            <Navbar />

            {/* Premium Header Section */}
            <header className="relative pt-40 pb-20 lg:pt-64 lg:pb-32 px-6">
                <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface/60 border border-border rounded-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-sm backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">About Us</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black text-foreground mb-10 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 italic">
                        Services that <br className="hidden md:block" />
                        <span className="not-italic">help you </span> <span className="text-plaiz-blue">move forward.</span>
                    </h1>

                    <p className="text-xl md:text-3xl text-muted max-w-4xl mb-16 leading-tight font-bold tracking-tight animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        Creative and practical solutions for individuals, and businesses to design, build, print, and grow.
                    </p>
                </div>
            </header>

            {/* Mission Section */}
            <section className="py-24 lg:py-48 px-6 bg-surface/40">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-12">
                            <h2 className="text-5xl lg:text-7xl font-black text-foreground tracking-tighter leading-none">
                                Scalable results <br /> for growing brands.
                            </h2>
                            <p className="text-xl text-muted font-bold tracking-tight leading-relaxed">
                                Plaiz Studio is built on the principle of managed excellence. We don't just provide services; we manage the process from start to finish to ensure your brand moves in the right direction.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { icon: Target, title: "Precision", desc: "Every project is executed with attention to detail and a focus on your goals." },
                                { icon: Lightbulb, title: "Innovation", desc: "We combine creative thinking with practical tools to build better solutions." },
                                { icon: TrendingUp, title: "Growth", desc: "Our primary mission is to help your personal or business brand scale." },
                                { icon: Users, title: "Community", desc: "Connecting the best experts with brands that value quality over everything." }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-[32px] bg-background border border-border hover:border-plaiz-blue/30 transition-all group">
                                    <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-plaiz-blue mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-black/5">
                                        <item.icon size={28} />
                                    </div>
                                    <h4 className="text-xl font-black text-foreground mb-3 tracking-tight">{item.title}</h4>
                                    <p className="text-muted text-sm font-bold leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Value Proposition */}
            <section className="py-32 lg:py-64 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-black text-foreground mb-12 tracking-tighter leading-tight">
                        We handle the complexity so <br /> you can focus on the <span className="text-plaiz-blue">vision.</span>
                    </h2>
                    <div className="w-24 h-1 bg-plaiz-blue mx-auto rounded-full mb-12 opacity-50" />
                    <p className="text-lg text-muted font-bold max-w-2xl mx-auto leading-relaxed">
                        Plaiz Studio is a managed digital services platform specializing in web design, graphic branding, and high-quality printing solutions.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
