import React from 'react'
import { useProjects } from '../../../hooks/useProjects'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import { Code, Globe, Smartphone, Terminal } from 'lucide-react'

import { useWorkerStats } from '../../../hooks/useWorkerStats'

const WebDesignerDashboard = () => {
    const { projects, loading } = useProjects({ category: 'Web Design' })
    const { stats: workerStats } = useWorkerStats()

    return (
        <div style={{ display: 'grid', gap: '3rem' }} className="animate-fade">
            <div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    Web <span className="gradient-text">Development</span>
                </h2>
                <p style={{ color: 'var(--color-steel)', fontSize: '1.1rem' }}>
                    Your workspace for web design and development projects
                </p>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <Card style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: '#3b82f6', borderRadius: '12px' }}>
                            <Globe size={24} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6' }}>{workerStats?.active_projects || projects.length}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-steel)' }}>Active Sites</p>
                        </div>
                    </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: '#10b981', borderRadius: '12px' }}>
                            <Code size={24} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{workerStats?.completed_projects || 0}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-steel)' }}>Completed Projects</p>
                        </div>
                    </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: '#8b5cf6', borderRadius: '12px' }}>
                            <Smartphone size={24} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6' }}>{workerStats?.average_rating ? Number(workerStats.average_rating).toFixed(1) : '—'}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-steel)' }}>Average Rating</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Active Projects */}
            <div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Active Web Projects</h3>
                {loading ? (
                    <p style={{ opacity: 0.6 }}>Loading your projects...</p>
                ) : projects.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {projects.map(project => (
                            <Card key={project.id} noPadding>
                                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{project.name}</h4>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                padding: '0.4rem 1rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                borderRadius: '99px',
                                                fontWeight: 800,
                                                textTransform: 'uppercase'
                                            }}>
                                                {project.status}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-steel)', fontWeight: 600 }}>
                                                <Code size={16} style={{ display: 'inline', marginRight: '4px' }} />
                                                Web Application
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline">View Code</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                        <Code size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Active Projects</h3>
                        <p style={{ opacity: 0.6 }}>You don't have any web projects assigned yet.</p>
                    </Card>
                )}
            </div>

            {/* Dev Tools Quick Access */}
            <Card title="Development Tools">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <Button variant="outline" style={{ padding: '1.2rem' }}>
                        <Terminal size={20} style={{ marginRight: '8px' }} />
                        Code Snippets
                    </Button>
                    <Button variant="outline" style={{ padding: '1.2rem' }}>
                        <Globe size={20} style={{ marginRight: '8px' }} />
                        Hosting Status
                    </Button>
                    <Button variant="outline" style={{ padding: '1.2rem' }}>
                        <Smartphone size={20} style={{ marginRight: '8px' }} />
                        Browser Testing
                    </Button>
                </div>
            </Card>
        </div>
    )
}

export default WebDesignerDashboard
