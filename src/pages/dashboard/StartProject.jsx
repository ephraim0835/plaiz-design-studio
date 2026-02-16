import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProjects } from '../../hooks/useProjects'
import { supabase } from '../../lib/supabaseClient'
import { Layout, PenTool, Globe, MessageSquare, ArrowRight, Printer } from 'lucide-react'

const services = [
    {
        id: 'web-design',
        title: 'Web Design',
        description: 'Custom websites, landing pages, and responsive layouts.',
        icon: <Globe size={32} color="#38bdf8" />
    },
    {
        id: 'ui-ux',
        title: 'UI/UX Design',
        description: 'User interfaces, prototypes, and user experience research.',
        icon: <Layout size={32} color="#818cf8" />
    },
    {
        id: 'branding',
        title: 'Branding',
        description: 'Logos, brand guidelines, and visual identity.',
        icon: <PenTool size={32} color="#f472b6" />
    },
    {
        id: 'print',
        title: 'Print Media',
        description: 'Business cards, posters, and physical marketing.',
        icon: <Printer size={32} color="#8b5cf6" />
    },
    {
        id: 'other',
        title: 'Talk to Staff',
        description: 'Not sure? Start a conversation with our team.',
        icon: <MessageSquare size={32} color="#22c55e" />
    }
]

const StartProject = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { createProject } = useProjects()

    const handleServiceSelect = async (service) => {
        try {
            // 1. Create Project
            const projectName = service.id === 'other' ? 'General Inquiry' : `${service.title} Project`

            // Map service ID to Category
            let category = 'General'
            if (service.id === 'web-design') category = 'Web Design'
            if (service.id === 'ui-ux') category = 'Graphic Design'
            if (service.id === 'branding') category = 'Graphic Design'
            if (service.id === 'print') category = 'Print Media'

            const { success, data } = await createProject({
                name: projectName,
                client_id: user.id,
                status: 'Not Started', // Match screenshot status
                description: `Started via ${service.title} selection.`,
                category: category
            })

            if (success && data && data[0]) {
                const newProjectId = data[0].id

                // 2. Send Initial Message
                const initialMessage = service.id === 'other'
                    ? "I'd like to talk to a staff member about a potential project."
                    : `I selected ${service.title}. I'd like to discuss my project requirements.`

                // We use direct supabase call here to avoid hooking complexity for a just-created ID
                await supabase
                    .from('messages')
                    .insert([
                        {
                            content: initialMessage,
                            sender_id: user.id,
                            project_id: newProjectId
                        }
                    ])

                // 3. Redirect to Messages
                navigate('/client/messages', { state: { projectId: newProjectId } })
            }
        } catch (error) {
            console.error("Error starting project:", error)
        }
    }

    return (
        <div className="animate-fade">
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Start New Project</h1>
            <p style={{ color: '#94a3b8', marginBottom: '32px', maxWidth: '600px' }}>
                Select a service below to start a conversation with our team. We'll get back to you with a quote and timeline.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {services.map(service => (
                    <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        style={{
                            background: '#131b2c',
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: '20px',
                            padding: '32px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.borderColor = '#38bdf8'
                            e.currentTarget.style.background = '#1e293b'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'
                            e.currentTarget.style.background = '#131b2c'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px'
                        }}>
                            {service.icon}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{service.title}</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>{service.description}</p>
                        </div>
                        <div style={{
                            marginTop: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#38bdf8',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}>
                            Get Started <ArrowRight size={16} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default StartProject
