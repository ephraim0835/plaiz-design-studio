import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../hooks/useProjects'
import { useMessages } from '../hooks/useMessages'
import { useLocation } from 'react-router-dom'
import { Send, Search, Paperclip, Mic, X, File, Download, ChevronDown, ChevronRight, MoreVertical, Smile } from 'lucide-react'

const MessageCenter = () => {
    const { user, role } = useAuth()
    const location = useLocation()
    const { projects, loading: projectsLoading, updateProject } = useProjects(
        role === 'admin' ? {} : role === 'worker' ? { worker_id: user?.id } : { client_id: user?.id }
    )
    const [selectedProjectId, setSelectedProjectId] = useState(location.state?.projectId || '')
    const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedProjectId)

    // UI States
    const [expandedCategories, setExpandedCategories] = useState({})

    // Message Input State
    const [newMessage, setNewMessage] = useState('')
    const [attachment, setAttachment] = useState(null)
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [recordingTime, setRecordingTime] = useState(0)

    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)
    const recordingInterval = useRef(null)

    // Group Projects by Category
    const groupedProjects = projects.reduce((acc, project) => {
        const cat = project.category || 'General'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(project)
        return acc
    }, {})

    // Initialize all categories as expanded
    useEffect(() => {
        if (projects.length > 0) {
            const allCats = {}
            projects.forEach(p => allCats[p.category || 'General'] = true)
            setExpandedCategories(prev => ({ ...allCats, ...prev }))
        }
    }, [projects.length]) // Only run when projects loaded

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (e) => {
        e.preventDefault()
        if ((!newMessage.trim() && !attachment)) return

        const result = await sendMessage(newMessage, user.id, attachment)
        if (result.success) {
            setNewMessage('')
            setAttachment(null)
        }
    }

    const handleStatusChange = async (newStatus) => {
        if (!selectedProjectId) return
        await updateProject(selectedProjectId, { status: newStatus })
    }

    const startRecording = async () => { /* ... implementation omitted for brevity, assuming same logic ... */ }
    const stopRecording = () => { /* ... */ }
    const cancelRecording = () => { /* ... */ }

    // Helper for formatting time
    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const activeProject = projects.find(p => p.id === selectedProjectId)

    return (
        <div className="animate-fade" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '0', height: 'calc(100vh - 120px)', background: '#020617', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Sidebar */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: '#0b101a' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#be185d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'white', fontWeight: 700 }}>{user?.email?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>{role === 'admin' ? 'Admin Chat View' : 'My Messages'}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>View all conversations</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {Object.entries(groupedProjects).map(([category, categoryProjects]) => (
                        <div key={category} style={{ marginBottom: '16px' }}>
                            <button
                                onClick={() => toggleCategory(category)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: '#1e293b', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                    color: 'white', cursor: 'pointer', marginBottom: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Category Icon Placeholder */}
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(34, 211, 238, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {expandedCategories[category] ? <ChevronDown size={18} color="#22d3ee" /> : <ChevronRight size={18} color="#22d3ee" />}
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{category}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{categoryProjects.length} active conversation{categoryProjects.length !== 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                                <div style={{ background: '#3b82f6', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                    {categoryProjects.length}
                                </div>
                            </button>

                            {expandedCategories[category] && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                                    {categoryProjects.map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => setSelectedProjectId(project.id)}
                                            style={{
                                                textAlign: 'left',
                                                padding: '12px 16px',
                                                background: selectedProjectId === project.id ? '#1e293b' : 'transparent',
                                                border: selectedProjectId === project.id ? '1px solid #3b82f6' : '1px solid transparent',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: '#334155', color: 'white', fontWeight: 600,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem'
                                            }}>
                                                {project.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Now</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '0.7rem', background: '#0ea5e9', padding: '2px 6px', borderRadius: '4px', color: 'white' }}>Client</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                    Total: {projects.length} conversations
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#020617', position: 'relative' }}>
                {!selectedProjectId ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', marginBottom: '16px' }}>
                            <div style={{ width: '64px', height: '64px', border: '2px solid #334155', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '40px', height: '30px', border: '2px solid #334155', borderRadius: '8px' }}></div>
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', marginBottom: '8px' }}>Select a conversation</h3>
                        <p style={{ margin: 0 }}>Choose a conversation from the sidebar or start a new chat</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0b101a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                                    {activeProject?.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {activeProject?.name}
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', padding: '2px 8px', borderRadius: '12px' }}>Online</span>
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>Client</p>
                                </div>
                            </div>

                            {/* Status Dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={activeProject?.status || 'Not Started'}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        style={{
                                            background: 'transparent', color: 'white', border: 'none',
                                            fontSize: '0.9rem', cursor: 'pointer', outline: 'none',
                                            appearance: 'none', paddingRight: '20px'
                                        }}
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="Started">Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                    <MoreVertical size={16} color="white" style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map((msg, index) => {
                                const isMe = msg.sender_id === user.id
                                // Check if system message (heuristic: starts with "Project created" or specific system sender)
                                const isSystem = false // Implement flag if DB supports it, for now rely on content heuristic? 

                                return (
                                    <div key={msg.id} style={{
                                        display: 'flex',
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        marginBottom: '4px'
                                    }}>
                                        <div style={{
                                            maxWidth: '70%',
                                            padding: '12px 18px',
                                            borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            background: isMe ? '#22d3ee' : '#1e293b',
                                            color: isMe ? '#000' : '#fff',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            fontWeight: isMe ? 500 : 400
                                        }}>
                                            {msg.content}
                                            <div style={{
                                                fontSize: '0.7rem',
                                                marginTop: '4px',
                                                textAlign: 'right',
                                                opacity: 0.7
                                            }}>
                                                {formatTime(msg.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '20px 24px', background: '#0b101a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#1e293b', borderRadius: '50px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} title="Attach">
                                    <Paperclip size={20} />
                                </button>
                                <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} title="Emoji">
                                    <Smile size={20} />
                                </button>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        padding: '8px 0'
                                    }}
                                />

                                {newMessage.trim() || attachment ? (
                                    <button
                                        type="submit"
                                        style={{ background: 'transparent', border: 'none', color: '#22d3ee', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Send size={20} />
                                    </button>
                                ) : (
                                    <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                        <Mic size={20} />
                                    </button>
                                )}
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default MessageCenter
