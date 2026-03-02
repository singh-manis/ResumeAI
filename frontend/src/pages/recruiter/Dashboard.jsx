import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { matchAPI, jobAPI, analyticsAPI } from '../../services/api';
import {
    LayoutGrid,
    BriefcaseBusiness,
    UsersRound,
    Zap,
    TrendingUp,
    Calendar,
    Settings2,
    Plus,
    Eye,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

import JobForm from './JobForm';
import JobDetail from './JobDetail';
import Candidates from './Candidates';
import Interviews from './Interviews';
import Messages from '../../components/Messages';
import Settings from '../../components/Settings';
import DashboardLayout from '../../components/layout/DashboardLayout';
import '../candidate/Dashboard.css';

/* ─── Dashboard Home ─────────────────────────────────────────── */
const DashboardHome = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [topMatches, setTopMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            const response = await analyticsAPI.getRecruiter();
            const data = response.data;
            setStats(data);

            // Fetch top AI Matches for the active jobs
            if (data.topJobs && data.topJobs.length > 0) {
                const activeJobs = data.topJobs.filter(j => j.isActive);
                const matchesPromises = activeJobs.slice(0, 3).map(job =>
                    matchAPI.getJobMatches(job.id).catch(() => ({ data: { matches: [] } }))
                );

                const matchesResults = await Promise.all(matchesPromises);
                let allMatches = [];

                matchesResults.forEach((res, i) => {
                    const job = activeJobs[i];
                    const validMatches = (res.data.matches || []).map(m => ({
                        ...m,
                        jobTitle: job.title
                    }));
                    allMatches = [...allMatches, ...validMatches];
                });

                // Sort by overall score and take the top 5
                allMatches.sort((a, b) => b.overallScore - a.overallScore);
                setTopMatches(allMatches.slice(0, 5));
            }
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
                    <h1>Welcome back, {user?.firstName}! 👋</h1>
                    <p>Here's an overview of your recruiting activity</p>
                </div>
                <Link to="/recruiter/jobs/new" className="btn btn-primary">
                    <Plus size={18} />
                    Post New Job
                </Link>
            </div>

            {loading ? (
                <div className="loading-cards">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card loading" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon resumes">
                                <BriefcaseBusiness size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.jobStats?.total || 0}</span>
                                <span className="stat-label">Total Jobs</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon applications">
                                <UsersRound size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.applicationStats?.total || 0}</span>
                                <span className="stat-label">Applications</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon matches">
                                <Zap size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.applicationStats?.shortlisted || 0}</span>
                                <span className="stat-label">Shortlisted</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon score">
                                <Eye size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{stats?.jobStats?.totalViews || 0}</span>
                                <span className="stat-label">Total Views</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <div className="dashboard-section">
                            <div className="section-header">
                                <h2>Top Performing Jobs</h2>
                                <Link to="/recruiter/jobs" className="view-all">
                                    View All <ChevronRight size={16} />
                                </Link>
                            </div>
                            <div className="section-content">
                                {stats?.topJobs?.length > 0 ? (
                                    <div className="applications-list">
                                        {stats.topJobs.map((job, index) => (
                                            <div key={index} className="application-item">
                                                <div className="app-info">
                                                    <strong>{job.title}</strong>
                                                    <span>{job.applicationCount} applications</span>
                                                </div>
                                                <span className={`status-badge ${job.isActive ? 'offer' : 'rejected'}`}>
                                                    {job.isActive ? 'Active' : 'Closed'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p>No jobs posted yet</p>
                                        <Link to="/recruiter/jobs/new" className="btn btn-secondary">
                                            Post a Job
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="dashboard-section">
                            <div className="section-header">
                                <h2><Zap size={20} className="text-warning" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> Top Incoming AI Matches</h2>
                                <Link to="/recruiter/candidates" className="view-all">
                                    View Pipeline <ChevronRight size={16} />
                                </Link>
                            </div>
                            <div className="section-content">
                                {topMatches.length > 0 ? (
                                    <div className="applications-list">
                                        {topMatches.map((match, index) => (
                                            <div key={index} className="application-item">
                                                <div className="app-info">
                                                    <strong>{match.resume?.user?.firstName} {match.resume?.user?.lastName}</strong>
                                                    <span>Applied for: {match.jobTitle}</span>
                                                </div>
                                                <span className={`status-badge ${match.overallScore >= 80 ? 'offer' : 'shortlisted'}`}>
                                                    {match.overallScore}% Match
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p>No high-scoring matches currently found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-grid" style={{ marginTop: 'var(--space-xl)' }}>
                        <div className="dashboard-section">
                            <div className="section-header">
                                <h2>Quick Actions</h2>
                            </div>
                            <div className="quick-actions">
                                <Link to="/recruiter/jobs/new" className="action-card">
                                    <Plus size={24} />
                                    <span>Post Job</span>
                                </Link>
                                <Link to="/recruiter/candidates" className="action-card">
                                    <UsersRound size={24} />
                                    <span>View Candidates</span>
                                </Link>
                                <Link to="/recruiter/analytics" className="action-card">
                                    <TrendingUp size={24} />
                                    <span>Analytics</span>
                                </Link>
                                <Link to="/recruiter/settings" className="action-card">
                                    <Settings2 size={24} />
                                    <span>Settings</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

/* ─── Jobs Page ──────────────────────────────────────────────── */
const JobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadJobs(); }, []);

    const loadJobs = async () => {
        try {
            const response = await jobAPI.getMyJobs();
            setJobs(response.data.jobs);
        } catch (error) {
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1>My Jobs</h1>
                    <p>Manage your job postings</p>
                </div>
                <Link to="/recruiter/jobs/new" className="btn btn-primary">
                    <Plus size={18} />
                    Post New Job
                </Link>
            </div>

            {loading ? (
                <div className="loading-cards">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="resume-card loading" />
                    ))}
                </div>
            ) : jobs.length > 0 ? (
                <div className="resumes-grid">
                    {jobs.map((job) => (
                        <div key={job.id} className="resume-card">
                            <div className="resume-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
                                <BriefcaseBusiness size={32} />
                            </div>
                            <div className="resume-info">
                                <h3>{job.title}</h3>
                                <p>{job.company}</p>
                                <div className="resume-meta">
                                    <span className="ats-score">{job._count?.applications || 0} applications</span>
                                    <span className={`status-badge ${job.isActive ? 'offer' : 'rejected'}`}>
                                        {job.isActive ? 'Active' : 'Closed'}
                                    </span>
                                </div>
                            </div>
                            <div className="resume-actions">
                                <Link to={`/recruiter/jobs/${job.id}`} className="btn btn-secondary btn-sm">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state-large">
                    <BriefcaseBusiness size={64} />
                    <h2>No jobs posted</h2>
                    <p>Create your first job posting to start receiving applications</p>
                    <Link to="/recruiter/jobs/new" className="btn btn-primary">
                        <Plus size={18} />
                        Post New Job
                    </Link>
                </div>
            )}
        </div>
    );
};

/* ─── Placeholder pages ──────────────────────────────────────── */
const AnalyticsPage = () => (
    <div className="dashboard-content">
        <div className="dashboard-header">
            <div>
                <h1>Analytics</h1>
                <p>Track your recruiting performance</p>
            </div>
        </div>
        <div className="coming-soon">
            <TrendingUp size={64} />
            <h2>Recruiting Analytics</h2>
            <p>Detailed charts and insights about your hiring funnel.</p>
        </div>
    </div>
);

/* ─── Main Recruiter Dashboard Component ─────────────────────── */
const RecruiterDashboard = () => {
    /* navGroups uses the same shape as CandidateDashboard → TopNavbar */
    const navGroups = [
        {
            label: 'Dashboard',
            path: '/recruiter',
            exact: true
        },
        {
            label: 'My Jobs',
            path: '/recruiter/jobs',
            items: [
                { path: '/recruiter/jobs', label: 'All Jobs', icon: <BriefcaseBusiness size={18} /> },
                { path: '/recruiter/jobs/new', label: 'Post New Job', icon: <Plus size={18} /> },
            ]
        },
        {
            label: 'Candidates',
            path: '/recruiter/candidates'
        },
        {
            label: 'Interviews',
            path: '/recruiter/interviews'
        },
        {
            label: 'Messages',
            path: '/recruiter/messages'
        },
        {
            label: 'Analytics',
            path: '/recruiter/analytics'
        },
        {
            label: 'Settings',
            path: '/recruiter/settings'
        }
    ];

    return (
        <DashboardLayout navGroups={navGroups}>
            <div className="content-wrapper">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/jobs/new" element={<JobForm />} />
                    <Route path="/jobs/:id" element={<JobDetail />} />
                    <Route path="/candidates" element={<Candidates />} />
                    <Route path="/interviews" element={<Interviews />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </div>
        </DashboardLayout>
    );
};

export default RecruiterDashboard;
