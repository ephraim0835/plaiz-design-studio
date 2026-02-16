import React from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useProjects } from '../../../hooks/useProjects'
import { Palette, Image, Layers, Sparkles, Folder, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useWorkerStats } from '../../../hooks/useWorkerStats'

const GraphicDesignerDashboard = () => {
    const { profile } = useAuth()
    const { projects, loading } = useProjects({ category: 'Graphic Design' })
    const { stats: workerStats } = useWorkerStats()

    const stats = [
        {
            label: 'Active Designs',
            value: workerStats?.active_projects || projects.length,
            icon: <Palette size={24} color="#ec4899" />,
            trend: 'Current Workload',
            trendUp: true
        },
        {
            label: 'Completed',
            value: workerStats?.completed_projects || '0',
            icon: <Image size={24} color="#8b5cf6" />,
            trend: 'Total Projects',
            trendUp: true
        },
        {
            label: 'Rating',
            value: workerStats?.average_rating ? Number(workerStats.average_rating).toFixed(1) : '—',
            icon: <Sparkles size={24} color="#f59e0b" />,
            trend: 'Average Score',
            trendUp: (workerStats?.average_rating || 0) >= 4.5
        }
    ]

    return (
        <div style={{ display: 'grid', gap: '32px' }} className="animate-fade">
            {/* Welcome Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(20,20,30,0.5) 100%)',
                padding: '32px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: 'rgba(236, 72, 153, 0.1)',
                        color: '#ec4899',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Graphic Designer
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 8px 0', color: 'white' }}>
                        Welcome, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Designer'}! 🎨
                    </h1>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>
                        Your creative workspace for graphic design projects.
                    </p>
                </div>
                {/* Decorative background glow */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)'
                }} />
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{
                        background: '#131b2c',
                        padding: '24px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '140px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 4px 0' }}>{stat.label}</p>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'white', margin: 0 }}>{stat.value}</p>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: '#0f2438',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <ArrowUpRight size={16} color={stat.trendUp ? '#22c55e' : '#94a3b8'} />
                            <span style={{ color: stat.trendUp ? '#22c55e' : '#94a3b8', fontWeight: 600 }}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Projects */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Active Projects</h3>
                </div>

                {loading ? (
                    <p style={{ opacity: 0.6 }}>Loading projects...</p>
                ) : projects.length > 0 ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {projects.map(project => (
                            <div key={project.id} style={{
                                background: '#131b2c',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.03)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'white' }}>{project.name}</h4>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 12px',
                                            background: 'rgba(236, 72, 153, 0.1)',
                                            color: '#ec4899',
                                            borderRadius: '99px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            {project.status}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            ID: {project.id.slice(0, 8)}
                                        </span>
                                    </div>
                                </div>
                                <Link to={`/worker/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                                    <button style={{
                                        background: 'transparent',
                                        border: '1px solid #334155',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = 'transparent' }}
                                    >
                                        View Details
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        background: '#0a0f1c',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        padding: '64px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px'
                    }}>
                        <Folder size={48} color="#334155" />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>No Active Projects</h3>
                        <p style={{ opacity: 0.6, margin: 0 }}>You don't have any design projects assigned yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GraphicDesignerDashboard
