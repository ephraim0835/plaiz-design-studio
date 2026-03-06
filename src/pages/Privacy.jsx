import { motion } from 'framer-motion';

const Privacy = () => {
    return (
        <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Privacy Policy</h1>
                <p className="text-slate-400 mb-12"><strong>Effective Date:</strong> March 2026</p>

                <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300">
                    <p>Plaiz Studio respects your privacy and is committed to protecting your personal information.</p>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <p className="mb-2">Plaiz Studio may collect the following information:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Project information provided by clients</li>
                            <li>Payment information processed through bank transfer or Paystack</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                        <p className="mb-2">Your information may be used to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Communicate about design projects</li>
                            <li>Deliver services requested by clients</li>
                            <li>Process payments</li>
                            <li>Improve the website experience</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Cookies and Analytics</h2>
                        <p>The Plaiz Studio website may use cookies or analytics tools to understand website usage and improve user experience.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
                        <p>Plaiz Studio does not sell or share personal data with third parties except when required for payment processing or legal obligations.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
                        <p>Reasonable measures are taken to protect personal information, but no method of internet transmission is completely secure.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Client Rights</h2>
                        <p>Clients may request access, correction, or deletion of their personal information by contacting Plaiz Studio.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Changes to This Policy</h2>
                        <p>Plaiz Studio may update this Privacy Policy periodically. Updates will be posted on this page.</p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};

export default Privacy;