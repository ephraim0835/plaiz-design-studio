import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Target, Lightbulb, TrendingUp, Users, ShieldCheck, Zap, Globe, Sparkles, Heart, Rocket } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-background min-h-screen selection:bg-plaiz-blue/10 selection:text-plaiz-blue overflow-x-hidden relative transition-colors duration-700">
            <Navbar />

            {/* Premium Header Section */}
            <header className="relative pt-40 pb-20 lg:pt-64 lg:pb-32 px-6">
                <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface/60 border border-border rounded-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-sm backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">A Legacy in the Making</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black text-foreground mb-10 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 italic">
                        Turning Bold Visions <br className="hidden md:block" />
                        <span className="not-italic">into Visible </span> <span className="text-plaiz-blue">Realities.</span>
                    </h1>

                    <p className="text-xl md:text-3xl text-muted max-w-4xl mb-16 leading-tight font-bold tracking-tight animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        At Plaiz Studio, we bridge the gap between "what if" and "here it is." We are a managed digital studio built for those who refuse to settle for average.
                    </p>
                </div>
            </header>

            {/* The Story Section */}
            <section className="py-24 lg:py-48 px-6 bg-surface/40 overflow-hidden relative">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-12">
                            <h2 className="text-5xl lg:text-7xl font-black text-foreground tracking-tighter leading-none">
                                It Started with <br /> a Search for Better.
                            </h2>
                            <div className="space-y-6 text-lg text-muted font-medium leading-relaxed max-w-xl">
                                <p>
                                    Plaiz Studio wasn't born in a boardroom; it was born from frustration. We saw too many entrepreneurs with incredible ideas getting lost in the "digital noise"—struggling to find designers who cared as much about their brand as they did.
                                </p>
                                <p>
                                    We realized that talent is everywhere, but **quality management** is rare. We decided to build a home for both.
                                </p>
                                <p className="font-bold text-foreground italic border-l-4 border-plaiz-blue pl-6 py-2">
                                    "Our goal was never just to create designs. It was to build a system where excellence is predictable, and growth is inevitable."
                                </p>
                                <p>
                                    Whether you're an individual professional or a scaling business, we provide the expertise and the infrastructure to help you do more of what you love while we handle the rest.
                                </p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-plaiz-blue/20 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="aspect-square bg-studio-dark rounded-[40px] border border-white/5 flex flex-col items-center justify-center p-12 relative z-10 overflow-hidden shadow-2xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-plaiz-blue to-transparent" />
                                <Sparkles size={80} className="text-plaiz-blue mb-8 animate-pulse" />
                                <h4 className="text-white text-2xl font-black mb-2">Authentic.</h4>
                                <h4 className="text-white/40 text-2xl font-black mb-2">Impactful.</h4>
                                <h4 className="text-white/20 text-2xl font-black">Scalable.</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission, Vision, Values - Versatile & Professional */}
            <section className="py-32 lg:py-64 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                        <div className="space-y-8 p-10 rounded-[40px] bg-background border border-border group hover:border-plaiz-blue/30 transition-all shadow-xl shadow-black/5">
                            <div className="w-16 h-16 rounded-2xl bg-plaiz-blue/10 flex items-center justify-center text-plaiz-blue">
                                <Rocket size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">The Mission</h3>
                            <p className="text-muted font-bold leading-relaxed">
                                To provide individuals and organizations with the creative and technical horsepower they need to lead their industries with confidence.
                            </p>
                        </div>

                        <div className="space-y-8 p-10 rounded-[40px] bg-background border border-border group hover:border-plaiz-cyan/30 transition-all shadow-xl shadow-black/5">
                            <div className="w-16 h-16 rounded-2xl bg-plaiz-cyan/10 flex items-center justify-center text-plaiz-cyan">
                                <Lightbulb size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">The Vision</h3>
                            <p className="text-muted font-bold leading-relaxed">
                                To redefine digital collaboration by making world-class design, web, and print solutions accessible, manageable, and exceptionally reliable.
                            </p>
                        </div>

                        <div className="space-y-8 p-10 rounded-[40px] bg-background border border-border group hover:border-plaiz-coral/30 transition-all shadow-xl shadow-black/5">
                            <div className="w-16 h-16 rounded-2xl bg-plaiz-coral/10 flex items-center justify-center text-plaiz-coral">
                                <Heart size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">The Values</h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Absolute Integrity", color: "bg-plaiz-blue" },
                                    { label: "Relentless Reliability", color: "bg-plaiz-cyan" },
                                    { label: "Human-Centric Design", color: "bg-plaiz-coral" }
                                ].map((val, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${val.color}`} />
                                        <p className="text-muted font-bold tracking-tight">{val.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Expertise & Benefits - The Unique Edge */}
            <section className="py-24 lg:py-48 px-6 bg-studio-dark relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(76,126,255,0.15),transparent)] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10 text-center mb-24">
                    <h2 className="text-5xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.85]">Vetted. Verified. <br /> Visionary.</h2>
                    <p className="text-white/40 text-xl font-bold max-w-2xl mx-auto tracking-tight">Why brands trust Plaiz Studio over the "traditional" alternatives.</p>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    {[
                        { icon: ShieldCheck, title: "Trust Guaranteed", desc: "Every project is fully managed and vetted before delivery." },
                        { icon: Zap, title: "Frictionless Flow", desc: "Stop hunting for freelancers; we have the dream team ready." },
                        { icon: TrendingUp, title: "Growth Mindset", desc: "We don't just finish tasks; we help build your legacy." },
                        { icon: Sparkles, title: "Premium Aesthetic", desc: "Our standards are high, so your brand looks even better." }
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
