import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    UserCheck,
    UserX,
    Shield,
    Mail,
    Calendar,
    Edit,
    Trash2,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: '',
        search: ''
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
            // Mock data for demo
            setUsers([
                {
                    id: '1',
                    firstName: 'John',
                    lastName: 'Developer',
                    email: 'john.developer@gmail.com',
                    role: 'CANDIDATE',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    _count: { resumes: 2, applications: 5 }
                },
                {
                    id: '2',
                    firstName: 'Sarah',
                    lastName: 'Recruiter',
                    email: 'recruiter@techcorp.com',
                    role: 'RECRUITER',
                    isActive: true,
                    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
                    _count: { jobs: 3 }
                },
                {
                    id: '3',
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@resumeanalyzer.com',
                    role: 'ADMIN',
                    isActive: true,
                    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.patch(`/admin/users/${userId}`, { isActive: !currentStatus });
            setUsers(prev =>
                prev.map(user =>
                    user.id === userId ? { ...user, isActive: !currentStatus } : user
                )
            );
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(user => user.id !== userId));
            toast.success('User deleted');
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const getRoleBadge = (role) => {
        const badges = {
            CANDIDATE: { class: 'candidate', icon: <Users size={12} />, label: 'Candidate' },
            RECRUITER: { class: 'recruiter', icon: <UserCheck size={12} />, label: 'Recruiter' },
            ADMIN: { class: 'admin', icon: <Shield size={12} />, label: 'Admin' }
        };
        return badges[role] || badges.CANDIDATE;
    };

    const filteredUsers = users.filter(user => {
        if (filters.role && user.role !== filters.role) return false;
        if (filters.search) {
            const search = filters.search.toLowerCase();
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            return fullName.includes(search) || user.email?.toLowerCase().includes(search);
        }
        return true;
    });

    return (
        <div className="user-management">
            <div className="page-header">
                <div>
                    <h1><Users size={28} /> User Management</h1>
                    <p>Manage platform users and permissions</p>
                </div>
                <button className="btn btn-secondary" onClick={loadUsers}>
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="user-stats">
                <div className="stat-card">
                    <div className="stat-value">{users.length}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {users.filter(u => u.role === 'CANDIDATE').length}
                    </div>
                    <div className="stat-label">Candidates</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {users.filter(u => u.role === 'RECRUITER').length}
                    </div>
                    <div className="stat-label">Recruiters</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {users.filter(u => u.isActive).length}
                    </div>
                    <div className="stat-label">Active</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                <div className="filter-group">
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    >
                        <option value="">All Roles</option>
                        <option value="CANDIDATE">Candidates</option>
                        <option value="RECRUITER">Recruiters</option>
                        <option value="ADMIN">Admins</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="loading-table">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="table-row loading"></div>
                    ))}
                </div>
            ) : (
                <div className="users-table">
                    <div className="table-header">
                        <div className="col user-col">User</div>
                        <div className="col role-col">Role</div>
                        <div className="col status-col">Status</div>
                        <div className="col date-col">Joined</div>
                        <div className="col actions-col">Actions</div>
                    </div>

                    {filteredUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            className="table-row"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <div className="col user-col">
                                <div className="user-avatar">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                                <div className="user-details">
                                    <strong>{user.firstName} {user.lastName}</strong>
                                    <span>{user.email}</span>
                                </div>
                            </div>

                            <div className="col role-col">
                                <span className={`role-badge ${getRoleBadge(user.role).class}`}>
                                    {getRoleBadge(user.role).icon}
                                    {getRoleBadge(user.role).label}
                                </span>
                            </div>

                            <div className="col status-col">
                                <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="col date-col">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </div>

                            <div className="col actions-col">
                                <button
                                    className="action-btn"
                                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                                    title={user.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                </button>
                                <button
                                    className="action-btn danger"
                                    onClick={() => deleteUser(user.id)}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="empty-row">
                            <p>No users found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserManagement;
