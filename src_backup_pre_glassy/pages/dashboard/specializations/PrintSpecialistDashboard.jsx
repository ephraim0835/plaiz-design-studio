import { useProjects } from '../../../hooks/useProjects'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import { Printer, Package, FileText, Truck } from 'lucide-react'

const PrintSpecialistDashboard = () => {
    const { projects, loading } = useProjects({ category: 'Print Media' })

    return (
        <div style={{ display: 'grid', gap: '3rem' }} className="animate-fade">
            <div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    Print <span className="gradient-text">Production</span>
                </h2>
                <p style={{ color: 'var(--color-steel)', fontSize: '1.1rem' }}>
                    Your workspace for print and production projects
                </p>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <Card style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: '#8b5cf6', borderRadius: '12px' }}>
                            <Printer size={24} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6' }}>{projects.length}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-steel)' }}>Active Jobs</p>
                        </div>
                    </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: '#f59e0b', borderRadius: '12px' }}>
                            <Package size={24} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>8</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-steel)' }}>In Production</p>
                        </div>
                    </div>
                </Card>

                <Card style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '12px', background: '#10b981', borderRadius: '12px' }}>
                            <Truck size={24} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>5</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-steel)' }}>Ready to Ship</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Active Projects */}
            <div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Active Print Jobs</h3>
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
                                                background: '#8b5cf6',
                                                color: 'white',
                                                borderRadius: '99px',
                                                fontWeight: 800,
                                                textTransform: 'uppercase'
                                            }}>
                                                {project.status}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-steel)', fontWeight: 600 }}>
                                                <Package size={16} style={{ display: 'inline', marginRight: '4px' }} />
                                                Print Materials
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline">View Specs</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                        <Printer size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Active Jobs</h3>
                        <p style={{ opacity: 0.6 }}>You don't have any print jobs assigned yet.</p>
                    </Card>
                )}
            </div>

            {/* Print Tools Quick Access */}
            <Card title="Production Tools">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <Button variant="outline" style={{ padding: '1.2rem' }}>
                        <FileText size={20} style={{ marginRight: '8px' }} />
                        Material Specs
                    </Button>
                    <Button variant="outline" style={{ padding: '1.2rem' }}>
                        <Package size={20} style={{ marginRight: '8px' }} />
                        Print Queue
                    </Button>
                    <Button variant="outline" style={{ padding: '1.2rem' }}>
                        <Truck size={20} style={{ marginRight: '8px' }} />
                        Vendor Management
                    </Button>
                </div>
            </Card>
        </div>
    )
}

export default PrintSpecialistDashboard
