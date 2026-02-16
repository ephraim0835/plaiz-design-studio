import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Card from '../components/Card';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-background min-h-screen transition-colors duration-700">
            <Navbar />

            <main className="pt-32 pb-24 px-6 lg:px-12 max-w-5xl mx-auto">
                <Card className="p-8 md:p-12 border-border shadow-soft glass-card">
                    <h1 className="text-4xl md:text-5xl font-black text-foreground mb-8 tracking-tighter">Privacy Policy</h1>
                    <p className="text-muted mb-12 font-medium italic">Last Updated: February 2026</p>

                    <div className="space-y-10 prose prose-invert max-w-none text-foreground">
                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">1. Information We Collect</h2>
                            <p className="leading-relaxed opacity-80">
                                We collect information you provide directly to us when creating an account, initiating a project, or communicating with us. This includes your name, email address, phone number, and project requirements.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">2. How We Use Your Information</h2>
                            <ul className="list-disc pl-6 space-y-3 opacity-80">
                                <li>To provide, maintain, and improve our services.</li>
                                <li>To facilitate project management and communication between clients and experts.</li>
                                <li>To process payments and prevent fraud.</li>
                                <li>To send project updates and administrative messages.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">3. Data Security</h2>
                            <p className="leading-relaxed opacity-80">
                                We use industry-standard security measures, including SSL encryption and secure database protocols provided by Supabase, to protect your personal information. Financial transactions are processed through verified, secure payment gateways (like Paystack).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">4. Data Sharing</h2>
                            <p className="leading-relaxed opacity-80">
                                We do not sell your personal data. We share information only as necessary to facilitate your projects (e.g., sharing project briefs with selected Experts) or as required by law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">5. Your Rights</h2>
                            <p className="leading-relaxed opacity-80">
                                You have the right to access, correct, or delete your personal information. You can manage most of your data directly through your account settings or by contacting our support team.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">6. Retaining Your Information</h2>
                            <p className="leading-relaxed opacity-80">
                                We retain user information for as long as your account is active or as needed to provide you with services and comply with legal obligations.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-border">
                            <p className="text-sm opacity-60">
                                For any privacy-related inquiries, please contact us at privacy@plaiz.studio
                            </p>
                        </section>
                    </div>
                </Card>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
