import { motion } from 'framer-motion';

const Terms = () => {
    return (
        <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Terms of Service</h1>
                <p className="text-slate-400 mb-12"><strong>Effective Date:</strong> March 2026</p>

                <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300">
                    <p>Welcome to Plaiz Studio. By using our website or services, you agree to the following terms.</p>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Services</h2>
                        <p>Plaiz Studio provides digital design services including but not limited to logos, flyers, social media graphics, and other digital design assets. Plaiz Studio does not provide physical products unless otherwise agreed.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Client Responsibilities</h2>
                        <p>Clients must provide accurate information, design content, and feedback required to complete their project. Delays in communication or missing information may affect project timelines.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Payment Terms</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Down Payment (DP)</h3>
                                <p>All projects require a non-refundable 40% deposit before work begins.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Final Payment</h3>
                                <p>The remaining 60% payment is required before final files are delivered. Final designs will contain a watermark until full payment has been completed.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. No Refund Policy</h2>
                        <p>Once a project begins, all payments are non-refundable, including the deposit. This policy protects the designer's time, effort, and resources.</p>
                        <p>Refunds will not be issued due to subjective design preferences or change requests.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Revisions</h2>
                        <p>Reasonable revisions are included to ensure client satisfaction. Revision requests must relate to the original project scope.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property</h2>
                        <p>Plaiz Studio retains the right to display completed design work in portfolios, promotional materials, and case studies.</p>
                        <p>Clients receive ownership of the final design files only after full payment is completed.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
                        <p>Plaiz Studio is not responsible for any indirect damages or losses resulting from the use of delivered designs.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Changes to Terms</h2>
                        <p>Plaiz Studio may update these terms at any time. Updates will be posted on this page.</p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};

export default Terms;
