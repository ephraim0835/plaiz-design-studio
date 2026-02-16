import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Card from '../components/Card';

const TermsAndConditions = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-background min-h-screen transition-colors duration-700">
            <Navbar />

            <main className="pt-32 pb-24 px-6 lg:px-12 max-w-5xl mx-auto">
                <Card className="p-8 md:p-12 border-border shadow-soft glass-card">
                    <h1 className="text-4xl md:text-5xl font-black text-foreground mb-8 tracking-tighter">Terms and Conditions</h1>
                    <p className="text-muted mb-12 font-medium italic">Last Updated: February 2026</p>

                    <div className="space-y-10 prose prose-invert max-w-none text-foreground">
                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">1. Acceptance of Terms</h2>
                            <p className="leading-relaxed opacity-80">
                                By accessing and using Plaiz Studio (the "Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">2. Nature of Service</h2>
                            <p className="leading-relaxed opacity-80">
                                Plaiz Studio is a creative solution platform that connects clients with a network of verified creative experts ("Experts"). Plaiz Studio acts as an intermediary, managing project delivery, communication, and secure payments.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">3. User Accounts</h2>
                            <p className="leading-relaxed opacity-80">
                                Users must provide accurate information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">4. Project Management & Payments</h2>
                            <ul className="list-disc pl-6 space-y-3 opacity-80">
                                <li><strong>Project Initiation:</strong> Projects are started through the Platform's booking system.</li>
                                <li><strong>Escrow System:</strong> Payments are held securely by Plaiz Studio and only released to Experts upon client approval of the final deliverables.</li>
                                <li><strong>Refunds:</strong> Refund requests are handled on a case-by-case basis through our dispute resolution process prior to project completion and final payout.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">5. Intellectual Property</h2>
                            <p className="leading-relaxed opacity-80">
                                Upon full payment and project completion, ownership of the final deliverables is transferred to the client. The Expert and Plaiz Studio retain the right to showcase the work in their respective portfolios unless a Non-Disclosure Agreement (NDA) is in place.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">6. Prohibited Conduct</h2>
                            <p className="leading-relaxed opacity-80">
                                Users may not bypass the Platform's payment systems, engage in fraudulent activity, or upload harmful content. We reserve the right to terminate accounts that violate these rules.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">7. Limitation of Liability</h2>
                            <p className="leading-relaxed opacity-80">
                                Plaiz Studio is not liable for indirect, incidental, or consequential damages arising from the use of the Platform or the services provided by Experts.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black mb-4 tracking-tight">8. Governing Law</h2>
                            <p className="leading-relaxed opacity-80">
                                These terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict of law principles.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-border">
                            <p className="text-sm opacity-60">
                                If you have any questions regarding these Terms, please contact us at support@plaiz.studio
                            </p>
                        </section>
                    </div>
                </Card>
            </main>

            <Footer />
        </div>
    );
};

export default TermsAndConditions;
