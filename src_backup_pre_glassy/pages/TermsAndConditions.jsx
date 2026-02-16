import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Card from '../components/Card'

const TermsAndConditions = () => {
    return (
        <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative' }}>
            <Navbar />

            <div className="container" style={{ paddingTop: '160px', paddingBottom: '120px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        Our <span className="gradient-text">Terms</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '3rem' }}>
                        Last updated: December 29, 2024
                    </p>

                    <Card style={{ padding: '3rem' }}>
                        <div style={{ display: 'grid', gap: '2rem', lineHeight: '1.8' }}>
                            {/* Introduction */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>1. Introduction</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    By using Plaiz, you agree to these terms.
                                    Please read them carefully.
                                </p>
                            </section>

                            {/* Services */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>2. Services</h2>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                    Plaiz Design Studio provides professional design services including but not limited to:
                                </p>
                                <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '2rem' }}>
                                    <li>Graphic Design</li>
                                    <li>Web Design and Development</li>
                                    <li>Print Design and Production</li>
                                    <li>Brand Identity Development</li>
                                </ul>
                            </section>

                            {/* User Accounts */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>3. User Accounts</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    You are responsible for maintaining the confidentiality of your account credentials and for all activities
                                    that occur under your account. You must immediately notify us of any unauthorized use of your account.
                                </p>
                            </section>

                            {/* Project Terms */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>4. Project Terms</h2>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                    All projects are subject to the following terms:
                                </p>
                                <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '2rem' }}>
                                    <li>Project timelines are estimates and may vary based on project complexity</li>
                                    <li>Revisions are limited to the scope agreed upon in the project brief</li>
                                    <li>Final deliverables will be provided upon full payment</li>
                                    <li>Client feedback and approvals are required at designated milestones</li>
                                </ul>
                            </section>

                            {/* Intellectual Property */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>5. Intellectual Property</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    Upon full payment, clients receive full rights to the final approved designs. Plaiz Design Studio
                                    retains the right to showcase completed work in our portfolio unless otherwise agreed in writing.
                                </p>
                            </section>

                            {/* Payment Terms */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>6. Payment Terms</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    Payment terms will be outlined in individual project agreements. Generally, a deposit is required
                                    to commence work, with the balance due upon project completion. Late payments may incur additional fees.
                                </p>
                            </section>

                            {/* Confidentiality */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>7. Confidentiality</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    We respect your privacy and will keep all project information confidential. We will not share your
                                    information with third parties without your explicit consent, except as required by law.
                                </p>
                            </section>

                            {/* Limitation of Liability */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>8. Limitation of Liability</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    Plaiz Design Studio shall not be liable for any indirect, incidental, special, or consequential damages
                                    arising out of or in connection with our services.
                                </p>
                            </section>

                            {/* Termination */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>9. Termination</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    Either party may terminate a project with written notice. In the event of termination, the client
                                    is responsible for payment for all work completed up to the termination date.
                                </p>
                            </section>

                            {/* Changes to Terms */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>10. Changes to Terms</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    We reserve the right to modify these terms at any time. Changes will be effective immediately upon
                                    posting to our website. Your continued use of our services constitutes acceptance of the modified terms.
                                </p>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>11. Contact Information</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    If you have any questions about these Terms and Conditions, please contact us at:
                                </p>
                                <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>
                                    <strong>Email:</strong> ofoli.ephraim2008@gmail.com<br />
                                    <strong>Website:</strong> Plaiz Design Studio
                                </p>
                            </section>
                        </div>
                    </Card>

                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <Link
                            to="/register"
                            style={{
                                color: 'var(--color-primary)',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '1.1rem'
                            }}
                        >
                            ← Back
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TermsAndConditions
