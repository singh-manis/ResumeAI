import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutGrid,
    UsersRound,
    BriefcaseBusiness,
    FileStack,
    Settings2,
    LogOut,
    Menu,
    X,
    BrainCircuit,
    Bell,
    ChevronRight,
    TrendingUp,
    Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import UserManagement from './UserManagement';
import Analytics from './Analytics';
import NotificationBell from '../../components/NotificationBell';
import Settings from '../../components/Settings';
import DashboardLayout from '../../components/layout/DashboardLayout';
import '../candidate/Dashboard.css';

// Dashboard Home
const DashboardHome = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard 👑</h1>
                    <p>Platform overview and management</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-cards">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card loading"></div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                                <UsersRound size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.totals?.users || 0}</span>
                                <span className="stat-label">Total Users</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                <FileStack size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.totals?.resumes || 0}</span>
                                <span className="stat-label">Resumes</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                                <BriefcaseBusiness size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.totals?.jobs || 0}</span>
                                <span className="stat-label">Jobs Posted</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                                <Activity size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.totals?.applications || 0}</span>
                                <span className="stat-label">Applications</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <div className="dashboard-section">
                            <div className="section-header">
                                <h2>Users by Role</h2>
                            </div>
                            <div className="section-content">
                                <div className="applications-list">
                                    <div className="application-item">
                                        <div className="app-info">
                                            <strong>Candidates</strong>
                                            <span>Job seekers</span>
                                        </div>
                                        <span className="status-badge shortlisted">
                                            {stats?.usersByRole?.CANDIDATE || 0}
                                        </span>
                                    </div>
                                    <div className="application-item">
                                        <div className="app-info">
                                            <strong>Recruiters</strong>
                                            <span>Employers</span>
                                        </div>
                                        <span className="status-badge pending">
                                            {stats?.usersByRole?.RECRUITER || 0}
                                        </span>
                                    </div>
                                    <div className="application-item">
                                        <div className="app-info">
                                            <strong>Admins</strong>
                                            <span>Platform admins</span>
                                        </div>
                                        <span className="status-badge reviewed">
                                            {stats?.usersByRole?.ADMIN || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-section">
                            <div className="section-header">
                                <h2>Quick Actions</h2>
                            </div>
                            <div className="quick-actions">
                                <Link to="/admin/users" className="action-card">
                                    <UsersRound size={24} />
                                    <span>Manage Users</span>
                                </Link>
                                <Link to="/admin/jobs" className="action-card">
                                    <BriefcaseBusiness size={24} />
                                    <span>View Jobs</span>
                                </Link>
                                <Link to="/admin/analytics" className="action-card">
                                    <TrendingUp size={24} />
                                    <span>Analytics</span>
                                </Link>
                                <Link to="/admin/settings" className="action-card">
                                    <Settings2 size={24} />
                                    <span>Settings</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-section" style={{ marginTop: 'var(--space-lg)' }}>
                        <div className="section-header">
                            <h2>Today's Activity</h2>
                        </div>
                        <div className="section-content">
                            <div className="applications-list">
                                <div className="application-item">
                                    <div className="app-info">
                                        <strong>New Users</strong>
                                        <span>Registered today</span>
                                    </div>
                                    <span className="stat-value" style={{ fontSize: '1.25rem' }}>
                                        {stats?.today?.newUsers || 0}
                                    </span>
                                </div>
                                <div className="application-item">
                                    <div className="app-info">
                                        <strong>New Jobs</strong>
                                        <span>Posted today</span>
                                    </div>
                                    <span className="stat-value" style={{ fontSize: '1.25rem' }}>
                                        {stats?.today?.newJobs || 0}
                                    </span>
                                </div>
                                <div className="application-item">
                                    <div className="app-info">
                                        <strong>New Applications</strong>
                                        <span>Submitted today</span>
                                    </div>
                                    <span className="stat-value" style={{ fontSize: '1.25rem' }}>
                                        {stats?.today?.newApplications || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Placeholder pages
const UsersPage = () => (
    <div className="dashboard-content">
        <div className="dashboard-header">
            <h1>User Management</h1>
            <p>Manage platform users</p>
        </div>
        <div className="coming-soon">
            <UsersRound size={64} />
            <h2>User Management</h2>
            <p>View, edit, and manage all platform users.</p>
        </div>
    </div>
);

const AdminJobsPage = () => (
    <div className="dashboard-content">
        <div className="dashboard-header">
            <h1>All Jobs</h1>
            <p>View all job postings</p>
        </div>
        <div className="coming-soon">
            <BriefcaseBusiness size={64} />
            <h2>Jobs Overview</h2>
            <p>Monitor and manage all job listings on the platform.</p>
        </div>
    </div>
);

const AdminAnalyticsPage = () => (
    <div className="dashboard-content">
        <div className="dashboard-header">
            <h1>Platform Analytics</h1>
            <p>Monitor platform performance</p>
        </div>
        <div className="coming-soon">
            <TrendingUp size={64} />
            <h2>Analytics Dashboard</h2>
            <p>Comprehensive platform analytics and insights.</p>
        </div>
    </div>
);

const AdminSettingsPage = () => (
    <div className="dashboard-content">
        <div className="dashboard-header">
            <h1>System Settings</h1>
            <p>Configure platform settings</p>
        </div>
        <div className="coming-soon">
            <Settings2 size={64} />
            <h2>System Configuration</h2>
            <p>Manage platform-wide settings and configurations.</p>
        </div>
    </div>
);

// Main Dashboard Component
const AdminDashboard = () => {
    /* navGroups uses the same shape as CandidateDashboard & RecruiterDashboard */
    const navGroups = [
        {
            label: 'Dashboard',
            path: '/admin',
            icon: <LayoutGrid size={20} />,
            exact: true
        },
        {
            label: 'Users',
            path: '/admin/users',
            icon: <UsersRound size={20} />
        },
        {
            label: 'Jobs',
            path: '/admin/jobs',
            icon: <BriefcaseBusiness size={20} />
        },
        {
            label: 'Analytics',
            path: '/admin/analytics',
            icon: <TrendingUp size={20} />
        },
        {
            label: 'Settings',
            path: '/admin/settings',
            icon: <Settings2 size={20} />
        }
    ];

    return (
        <DashboardLayout navGroups={navGroups}>
            <div className="content-wrapper">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/jobs" element={<AdminJobsPage />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
