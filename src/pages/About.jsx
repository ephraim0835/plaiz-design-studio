import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Target, Lightbulb, TrendingUp, Users, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-background min-h-screen selection:bg-plaiz-blue/10 selection:text-plaiz-blue overflow-x-hidden relative transition-colors duration-700">
            <Navbar />

            {/* Premium Header Section */}
            <header className="relative pt-40 pb-20 lg:pt-64 lg:pb-32 px-6">
                <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface/60 border border-border rounded-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-sm backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Who We Are</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black text-foreground mb-10 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 italic">
                        Empowering Your <br className="hidden md:block" />
                        <span className="not-italic">Vision, Managed </span> <span className="text-plaiz-blue">with Precision.</span>
                    </h1>

                    <p className="text-xl md:text-3xl text-muted max-w-4xl mb-16 leading-tight font-bold tracking-tight animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        Plaiz Studio is more than a platform—it's your dedicated partner in digital growth. We provide high-impact solutions for brands that demand excellence.
                    </p>
                </div>
            </header>

            {/* Background Story Section */}
            <section className="py-24 lg:py-48 px-6 bg-surface/40 overflow-hidden relative">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-12">
                            <h2 className="text-5xl lg:text-7xl font-black text-foreground tracking-tighter leading-none">
                                The Story Behind <br /> Plaiz Studio.
                            </h2>
                            <div className="space-y-6 text-lg text-muted font-medium leading-relaxed max-w-xl">
                                <p>
                                    Plaiz Studio began with a simple observation: the digital service world was broken. Businesses were often left stranded between expensive, slow-moving agencies and talented but often unreliable freelancers.
                                </p>
                                <p>
                                    We saw a need for a "middle ground"—a platform that combine the agility of independent experts with the accountability, quality control, and reliability of a managed agency.
                                </p>
                                <p className="font-bold text-foreground italic">
                                    "We didn't just want to build another gig platform; we wanted to build a growth engine."
                                </p>
                                <p>
                                    Today, Plaiz Studio serves as a bridge between creative vision and technical execution, ensuring that every project we touch moves your brand forward.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-square bg-plaiz-blue/10 rounded-[40px] border border-plaiz-blue/20 flex items-center justify-center p-12">
                                <Sparkles size={120} className="text-plaiz-blue/40 animate-pulse" />
                            </div>
                            <div className="absolute -bottom-10 -right-10 p-10 glass-panel !bg-black/60 !backdrop-blur-2xl border-white/20 text-white rounded-[32px] max-w-xs shadow-2xl">
                                <p className="text-sm font-bold leading-relaxed mb-4">"Our mission is to simplify complexity so you can focus on what matters most: your vision."</p>
                                <div className="h-px w-12 bg-plaiz-blue mb-4" />
                                <p className="text-[10px] font-black tracking-widest uppercase">The Plaiz Philosophy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission, Vision, Values */}
            <section className="py-32 lg:py-64 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                        <div className="space-y-8 p-10 rounded-[40px] bg-background border border-border group hover:border-plaiz-blue/30 transition-all shadow-xl shadow-black/5">
                            <div className="w-16 h-16 rounded-2xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                                <Target size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">Our Mission</h3>
                            <p className="text-muted font-bold leading-relaxed">
                                To empower brands by providing a managed digital service ecosystem where quality, transparency, and expert execution are guaranteed.
                            </p>
                        </div>

                        <div className="space-y-8 p-10 rounded-[40px] bg-background border border-border group hover:border-plaiz-cyan/30 transition-all shadow-xl shadow-black/5">
                            <div className="w-16 h-16 rounded-2xl bg-plaiz-cyan/10 flex items-center justify-center text-plaiz-cyan">
                                <Globe size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">Our Vision</h3>
                            <p className="text-muted font-bold leading-relaxed">
                                To become the global standard for digital collaboration, enabling businesses of all sizes to access world-class creative and technical talent with ease.
                            </p>
                        </div>

                        <div className="space-y-8 p-10 rounded-[40px] bg-background border border-border group hover:border-plaiz-coral/30 transition-all shadow-xl shadow-black/5">
                            <div className="w-16 h-16 rounded-2xl bg-plaiz-coral/10 flex items-center justify-center text-plaiz-coral">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">Our Values</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-plaiz-coral" />
                                    <p className="text-muted font-bold tracking-tight">Radical Transparency</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-plaiz-coral" />
                                    <p className="text-muted font-bold tracking-tight">Managed Excellence</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-plaiz-coral" />
                                    <p className="text-muted font-bold tracking-tight">Integrity in Every Pixel</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-24 lg:py-48 px-6 bg-studio-dark relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-plaiz-blue/20 to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 text-center mb-24">
                    <h2 className="text-5xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.85]">Choose Expertise. <br /> Choose Results.</h2>
                    <p className="text-white/40 text-xl font-bold max-w-2xl mx-auto tracking-tight">Everything you need to scale your brand, managed under one roof.</p>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    {[
                        { icon: Zap, title: "Verified Experts", desc: "Every creator is vetted for skill and professionalism." },
                        { icon: ShieldCheck, title: "Secure Escrow", desc: "Your payments are protected until you approve the work." },
                        { icon: Lightbulb, title: "Strategic Design", desc: "We don't just make it pretty; we make it perform." },
                        { icon: TrendingUp, title: "Scalable Output", desc: "From business cards to full web ecosystems." }
                    ].map((item, idx) => (
                        <div key={idx} className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-plaiz-blue/20 flex items-center justify-center text-plaiz-blue mb-8 group-hover:scale-110 transition-transform">
                                <item.icon size={24} />
                            </div>
                            <h4 className="text-xl font-black mb-4 tracking-tight">{item.title}</h4>
                            <p className="text-white/40 text-sm font-bold leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
