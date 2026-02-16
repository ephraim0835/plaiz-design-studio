import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Card from '../components/Card';

const CookiePolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-background min-h-screen transition-colors duration-700">
            <Navbar />

            <main className="pt-32 pb-24 px-6 lg:px-12 max-w-5xl mx-auto">
                <Card className="p-8 md:p-12 border-border shadow-soft glass-card">
                    <h1 className="text-4xl md:text-5xl font-black text-foreground mb-8 tracking-tighter">Cookie Policy</h1>
                    <p className="text-muted mb-12 font-medium italic">Last Updated: February 2026</p>

                    <div className="space-y-10 prose prose-invert max-w-none text-foreground">
                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">What are Cookies?</h2>
                            <p className="leading-relaxed opacity-80">
                                Cookies are small text files stored on your device that help us provide a better experience. They allow us to remember your preferences and understand how you interact with our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">How We Use Cookies</h2>
                            <ul className="list-disc pl-6 space-y-3 opacity-80">
                                <li><strong>Essential Cookies:</strong> Required for the platform to function, such as authentication and session management.</li>
                                <li><strong>Functional Cookies:</strong> Remember your settings, such as theme preferences and language.</li>
                                <li><strong>Performance Cookies:</strong> Help us understand how the site is used to improve our services.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Third-Party Cookies</h2>
                            <p className="leading-relaxed opacity-80">
                                Some services we use, such as Supabase for authentication or Paystack for payments, may set their own cookies to ensure their services work correctly within our Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">Managing Cookies</h2>
                            <p className="leading-relaxed opacity-80">
                                Most web browsers allow you to control cookies through their settings. However, disabling essential cookies may limit your ability to use certain features of the Platform.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-border">
                            <p className="text-sm opacity-60">
                                Questions about our cookie usage? Contact us at support@plaiz.studio
                            </p>
                        </section>
                    </div>
                </Card>
            </main>

            <Footer />
        </div>
    );
};

export default CookiePolicy;
