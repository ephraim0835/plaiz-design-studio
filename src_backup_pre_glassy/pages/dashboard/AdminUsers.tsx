import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import {
    Users,
    Search,
    UserPlus,
    MoreHorizontal,
    Shield,
    Mail,
    CheckCircle,
    XCircle,
    Trash2,
    Copy,
    AlertCircle,
    X,
    History
} from 'lucide-react';
import { Profile, UserRole } from '../../types';
import { useInviteCodes } from '../../hooks/useInviteCodes';

const AdminUsers: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('client');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const { requestInviteCode, loading: inviteLoading } = useInviteCodes();

    // Edit Role State
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [newRole, setNewRole] = useState<UserRole | null>(null);
    const [minPrice, setMinPrice] = useState<number | null>(null);

    const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'deleted'>('users');
    const [inviteCodes, setInviteCodes] = useState<any[]>([]);
    const [deletedUsers, setDeletedUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchProfiles();
        fetchInviteCodes();
        fetchDeletedUsers();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        console.log('[AdminUsers] Fetching profiles...');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[AdminUsers] Error fetching profiles:', error);
            alert('Error loading users: ' + error.message);
        } else {
            console.log('[AdminUsers] Profiles loaded:', data);
            setProfiles(data || []);
        }
        setLoading(false);
    };

    const fetchDeletedUsers = async () => {
        const { data, error } = await supabase
            .from('deleted_users_log')
            .select('*')
            .order('deleted_at', { ascending: false });

        if (error) console.error('Error fetching deleted users:', error);
        else setDeletedUsers(data || []);
    };

    const fetchInviteCodes = async () => {
        const { data, error } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('used', false)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching invite codes:', error);
        else setInviteCodes(data || []);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const { success, code, error } = await requestInviteCode(inviteEmail, inviteRole);
        if (success && code) {
            setGeneratedCode(code);
            fetchInviteCodes(); // Refresh list
        } else {
            alert('Failed to generate invite: ' + error);
        }
    };

    const handleRevokeCode = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this access code?')) return;

        const { error } = await supabase
            .from('invite_codes')
            .delete()
            .eq('id', id);

        if (error) alert('Error revoking code');
        else fetchInviteCodes();
    };

    // ... existing handlers ...

    const closeInviteModal = () => {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('client');
        setGeneratedCode(null);
    };

    const handleCopyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            alert('Invite code copied to clipboard!');
        }
    };

    const handleDeactivate = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;

        const { error } = await supabase
            .from('profiles')
            .update({ is_active: !currentStatus })
            .eq('id', userId);

        if (error) {
            alert('Error updating user status');
        } else {
            fetchProfiles();
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete ${userName}? This will remove their account and profile forever.`)) return;

        const { data, error } = await supabase.rpc('delete_user', { target_user_id: userId });

        if (error) {
            console.error('Delete Error:', error);
            alert('Error deleting user: ' + error.message);
        } else {
            console.log('Delete response:', data);

            // Check if deletion actually succeeded
            if (data?.success === false) {
                alert('Failed to delete user: ' + (data.error || 'Unknown error'));
                return;
            }

            alert('User deleted successfully.');

            // Add small delay to ensure database has processed the deletion
            await new Promise(resolve => setTimeout(resolve, 500));

            // Refresh both lists
            await fetchProfiles();
            await fetchDeletedUsers();
        }
    };

    const handleUpdateRole = async () => {
        if (!editingUser || !newRole) return;

        console.log(`[AdminUsers] Updating role for ${editingUser.email} to ${newRole}...`);

        const { error } = await supabase.rpc('update_user_role', {
            target_user_id: editingUser.id,
            new_role: newRole
        });

        if (error) {
            console.error('[AdminUsers] Role Update Error:', error);
            alert('Error updating role: ' + error.message);
        } else {
            console.log('[AdminUsers] Role updated successfully');
            setEditingUser(null);
            setNewRole(null);
            fetchProfiles(); // Refresh user list
        }
    };

    const filteredProfiles = profiles.filter(p => {
        const query = searchQuery.toLowerCase();
        return (
            p.full_name?.toLowerCase().includes(query) ||
            p.email?.toLowerCase().includes(query) ||
            p.role?.toLowerCase().includes(query)
        );
    });

    return (
        <DashboardLayout title="User Management">
            <div className="space-y-8 animate-fade-in pb-12 relative">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">All Users</h2>
                        <p className="text-[var(--text-muted)] text-sm font-medium mt-1">Manage specialists and client access.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/search:text-plaiz-cyan transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder={activeTab === 'users' ? "Search by name or email..." : "Search codes..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-6 text-[var(--text-primary)] text-sm focus:ring-plaiz-cyan/20 focus:border-plaiz-cyan/50 transition-all outline-none w-full md:w-[350px]"
                            />
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="p-4 bg-plaiz-blue text-white rounded-2xl shadow-xl shadow-plaiz-blue/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <UserPlus size={20} />
                            <span className="font-bold text-sm hidden md:inline">New Code</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'text-plaiz-cyan border-b-2 border-plaiz-cyan' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        Users List
                    </button>
                    <button
                        onClick={() => setActiveTab('invites')}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'invites' ? 'text-plaiz-cyan border-b-2 border-plaiz-cyan' : 'text-white/40 hover:text-white'}`}
                    >
                        Access Codes
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-muted)]">{inviteCodes.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('deleted')}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'deleted' ? 'text-plaiz-cyan border-b-2 border-plaiz-cyan' : 'text-white/40 hover:text-white'}`}
                    >
                        Deleted Accounts
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-muted)]">{deletedUsers.length}</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        {activeTab === 'users' ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)]">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">User</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Role</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        [1, 2, 3].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={4} className="px-8 py-8"><div className="h-4 bg-white/5 rounded w-1/2" /></td>
                                            </tr>
                                        ))
                                    ) : filteredProfiles.length > 0 ? (
                                        filteredProfiles.map((p) => (
                                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-plaiz-cyan/20 to-plaiz-blue/20 flex items-center justify-center border border-white/5 cursor-pointer" onClick={() => { setEditingUser(p); setNewRole(p.role); setMinPrice(p.minimum_price || null); }}>
                                                            <span className="text-sm font-black text-plaiz-cyan">
                                                                {p.full_name?.charAt(0) || '?'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-bold text-sm">{p.full_name || 'Unnamed User'}</h4>
                                                            <p className="text-white/30 text-xs font-medium">{p.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button
                                                        onClick={() => { setEditingUser(p); setNewRole(p.role); }}
                                                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all
                                                        ${p.role === 'admin' ? 'bg-plaiz-coral/10 border-plaiz-coral/20 text-plaiz-coral' :
                                                                p.role === 'client' ? 'bg-plaiz-cyan/10 border-plaiz-cyan/20 text-plaiz-cyan' :
                                                                    'bg-plaiz-blue/10 border-plaiz-blue/20 text-plaiz-blue'}`}
                                                    >
                                                        {p.role?.replace('_', ' ')}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] ${p.is_active !== false ? 'bg-green-500' : 'bg-red-500 shadow-red-500/50'}`} />
                                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                                                            {p.is_active !== false ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => { setEditingUser(p); setNewRole(p.role); }}
                                                            className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors"
                                                            title="Edit Role"
                                                        >
                                                            <Shield size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeactivate(p.id, p.is_active !== false)}
                                                            className={`p-2.5 rounded-xl bg-white/5 transition-colors ${p.is_active !== false ? 'text-white/40 hover:text-yellow-500' : 'text-green-500/40 hover:text-green-500'}`}
                                                            title={p.is_active !== false ? "Deactivate User" : "Activate User"}
                                                        >
                                                            {p.is_active !== false ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(p.id, p.full_name || p.email || 'this user')}
                                                            className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-plaiz-coral transition-colors"
                                                            title="Delete Permanently"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No users found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : activeTab === 'invites' ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Access Code</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Target Role</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Sent To</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Expires</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {inviteCodes.length > 0 ? (
                                        inviteCodes.map((code) => (
                                            <tr key={code.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="font-mono text-xl font-black text-white tracking-widest">{code.code}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">
                                                        {code.role?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={14} className="text-white/20" />
                                                        <span className="text-sm font-medium text-white/60">{code.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-medium text-white/40">
                                                        {new Date(code.expires_at).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button
                                                        onClick={() => handleRevokeCode(code.id)}
                                                        className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:bg-plaiz-coral/10 hover:text-plaiz-coral transition-all opacity-0 group-hover:opacity-100"
                                                        title="Revoke Code"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No active access codes</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Name / Email</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Former Role</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Date Deleted</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {deletedUsers.length > 0 ? (
                                        deletedUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm tracking-tight">{user.full_name || 'Anonymous'}</h4>
                                                        <p className="text-white/30 text-xs font-medium">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs text-white/40 font-medium">
                                                    {new Date(user.deleted_at).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle size={14} className="text-plaiz-coral" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-plaiz-coral">Purged</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No deletion history</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                            <button
                                onClick={closeInviteModal}
                                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-2xl font-black text-white mb-2">New User</h3>
                            <p className="text-white/40 text-sm font-medium mb-6">Create a code for a new user.</p>

                            {!generatedCode ? (
                                <form onSubmit={handleInvite} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-plaiz-blue focus:ring-1 focus:ring-plaiz-blue outline-none transition-colors"
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Role</label>
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-plaiz-blue focus:ring-1 focus:ring-plaiz-blue outline-none transition-colors appearance-none"
                                        >
                                            <option value="client">Client</option>
                                            <option value="graphic_designer">Graphic Designer</option>
                                            <option value="web_designer">Web Designer</option>
                                            <option value="worker">Worker (General)</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={inviteLoading}
                                        className="w-full py-4 bg-plaiz-blue hover:bg-blue-600 text-white font-bold rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
                                    >
                                        {inviteLoading ? 'Generating...' : 'Generate Invite Code'}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                                        <CheckCircle className="text-green-500" size={20} />
                                        <p className="text-green-500 text-sm font-bold">Invite code generated successfully!</p>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Invite Code</p>
                                        <div className="text-3xl font-mono font-black text-white tracking-widest mb-4">
                                            {generatedCode}
                                        </div>
                                        <button
                                            onClick={handleCopyCode}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors"
                                        >
                                            <Copy size={16} /> Copy Code
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-white/40 text-xs">
                                            Share this code with <span className="text-white">{inviteEmail}</span>.<br />
                                            They will need it during registration.
                                        </p>
                                    </div>

                                    <button
                                        onClick={closeInviteModal}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Role Modal */}
                {editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-3xl p-8 relative shadow-2xl">
                            <button
                                onClick={() => { setEditingUser(null); setNewRole(null); }}
                                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-black text-white mb-2">Edit Role</h3>
                            <p className="text-white/40 text-sm font-medium mb-6">Change role for <strong>{editingUser.full_name}</strong>.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Select Role</label>
                                    <select
                                        value={newRole || 'client'}
                                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-plaiz-cyan focus:ring-1 focus:ring-plaiz-cyan outline-none transition-colors appearance-none"
                                    >
                                        <option value="client">Client</option>
                                        <option value="worker">Specialist (Worker)</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>

                                {(newRole === 'worker' || editingUser.role === 'worker' || editingUser.role.includes('designer') || editingUser.role.includes('specialist')) && (
                                    <div>
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Minimum Price (NGN)</label>
                                        <input
                                            type="number"
                                            value={minPrice || ''}
                                            onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder="e.g. 50000"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-plaiz-cyan focus:ring-1 focus:ring-plaiz-cyan outline-none transition-colors"
                                        />
                                        <p className="text-[10px] text-white/20 font-medium mt-2">Workers with no minimum price are skipped by AI matching.</p>
                                    </div>
                                )}

                                <button
                                    onClick={async () => {
                                        if (!editingUser) return;
                                        setLoading(true);
                                        const { error } = await supabase
                                            .from('profiles')
                                            .update({
                                                role: newRole || editingUser.role,
                                                minimum_price: minPrice
                                            })
                                            .eq('id', editingUser.id);

                                        if (error) alert(error.message);
                                        else {
                                            setEditingUser(null);
                                            fetchProfiles();
                                        }
                                        setLoading(false);
                                    }}
                                    className="w-full py-3 bg-plaiz-cyan text-white font-bold rounded-xl transition-colors mt-2"
                                >
                                    {loading ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminUsers;
