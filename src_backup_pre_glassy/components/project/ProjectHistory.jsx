import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { MessageSquare, Download, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ProjectHistory = () => {
    const { user, role } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('projects')
                .select(`
                    *,
                    worker:profiles!worker_id(full_name, avatar_url),
                    client:profiles!client_id(full_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (role === 'client') {
                query = query.eq('client_id', user.id);
            } else {
                query = query.eq('worker_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            created: { label: 'Created', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            assigned: { label: 'Your expert is ready', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
            active: { label: 'In progress', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
            delivered: { label: 'Delivered', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
            approved: { label: 'Completed', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
            rejected: { label: 'Needs revision', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
        };

        const config = statusConfig[status] || statusConfig.created;

        return (
            <span className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getServiceIcon = (serviceType) => {
        // Return appropriate icon based on service type
        return '🎨'; // Placeholder
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-plaiz-blue" size={32} />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex p-6 bg-white/5 rounded-3xl mb-6">
                    <Clock size={48} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                    {role === 'client' ? "You haven't started any projects yet" : "No projects assigned yet"}
                </h3>
                <p className="text-white/40 text-sm">
                    {role === 'client' ? "Start your first project to see it here" : "Projects will appear here when assigned to you"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{getServiceIcon(project.service_type)}</span>
                                <h3 className="font-bold text-white text-lg">{project.title}</h3>
                            </div>
                            <p className="text-xs text-white/40 uppercase tracking-wider font-bold">
                                {project.service_type?.replace('_', ' ')}
                            </p>
                        </div>
                        {getStatusBadge(project.status)}
                    </div>

                    <p className="text-sm text-white/60 mb-4 line-clamp-2">
                        {project.description}
                    </p>

                    {/* Show worker/client info */}
                    {role === 'client' && project.worker && (
                        <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-2xl">
                            {project.worker.avatar_url ? (
                                <img
                                    src={project.worker.avatar_url}
                                    alt={project.worker.full_name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-plaiz-cyan/20"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-plaiz-cyan to-plaiz-blue flex items-center justify-center text-white font-black">
                                    {project.worker.full_name?.charAt(0) || 'W'}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-white">{project.worker.full_name}</p>
                                <p className="text-xs text-white/40">Your expert</p>
                            </div>
                        </div>
                    )}

                    {role !== 'client' && project.client && (
                        <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-2xl">
                            {project.client.avatar_url ? (
                                <img
                                    src={project.client.avatar_url}
                                    alt={project.client.full_name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-plaiz-cyan/20"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-plaiz-cyan to-plaiz-blue flex items-center justify-center text-white font-black">
                                    {project.client.full_name?.charAt(0) || 'C'}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-white">{project.client.full_name}</p>
                                <p className="text-xs text-white/40">Client</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                        {project.conversation_id && (
                            <Link
                                to={`/dashboard/messages/project/${project.id}`}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-plaiz-blue/10 border border-plaiz-blue/20 text-plaiz-blue rounded-2xl font-bold text-sm hover:bg-plaiz-blue/20 transition-all"
                            >
                                <MessageSquare size={16} />
                                Open Chat
                            </Link>
                        )}

                        {project.final_file && (
                            <a
                                href={project.final_file}
                                download
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold text-sm hover:bg-green-500/20 transition-all"
                            >
                                <Download size={16} />
                                Download
                            </a>
                        )}
                    </div>

                    {/* Budget & Date */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <span className="text-xs text-white/40">
                            {new Date(project.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                        {project.budget && (
                            <span className="text-sm font-bold text-white">
                                ₦{project.budget.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectHistory;
