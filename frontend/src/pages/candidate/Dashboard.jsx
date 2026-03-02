import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    LayoutGrid,
    FileStack,
    BriefcaseBusiness,
    Zap,
    TrendingUp,
    BotMessageSquare,
    Settings2,
    LogOut,
    Menu,
    X,
    PenTool,
    UploadCloud,
    ChevronRight,
    Bell,
    Bookmark,
    Send,
    Activity,
    BrainCircuit,
    MessageSquare,
    Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeAPI, matchAPI, analyticsAPI, gamificationAPI } from '../../services/api';
import Jobs from './Jobs';
import JobDetail from './JobDetail';
import ResumeDetail from './ResumeDetail';
import Chat from './Chat';
import Matches from './Matches';
import SavedJobs from './SavedJobs';
import Applications from './Applications';
import Interviews from './Interviews';
import ResumeBuilder from './ResumeBuilder';
import QuizPractice from './QuizPractice';
import InterviewPractice from './InterviewPractice';
import NotificationBell from '../../components/NotificationBell';
import Messages from '../../components/Messages';
import Settings from '../../components/Settings';
import DashboardLayout from '../../components/layout/DashboardLayout';
import XPProgress from '../../components/dashboard/XPProgress';
import ActivityChart from '../../components/dashboard/ActivityChart';
import DailyChallenge from '../../components/dashboard/DailyChallenge';
import './Dashboard.css';

// Dashboard Home
const DashboardHome = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [gamification, setGamification] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, gamificationRes] = await Promise.all([
                analyticsAPI.getCandidate(),
                gamificationAPI.getStats()
            ]);
            setStats(statsRes.data);
            setGamification(gamificationRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-hero">
                <div className="hero-main-layer">
                    <div className="hero-text-area">
                        <h1>Welcome back, <span className="highlight-text">{user?.firstName}</span>!</h1>
                        <p className="hero-subtitle">Optimize your profile and track your AI-driven career journey.</p>
                    </div>
                </div>

                <div className="hero-illustration">
                    <img src="/dashboard-hero-bg.png" alt="Industrial Tech Background" className="hero-bg-image" />
                    <div className="hero-overlay-gradient"></div>
                </div>

                <div className="hero-dock">
                    <div className="hero-dock-stats">
                        <div className="dock-stat">
                            <div className="dock-icon text-warning">
                                <Zap size={16} />
                            </div>
                            <div className="dock-info">
                                <span className="dock-value">{stats?.matchStats?.count || 0}</span>
                                <span className="dock-label">New Matches</span>
                            </div>
                        </div>
                        <div className="dock-stat">
                            <div className="dock-icon text-primary">
                                <TrendingUp size={16} />
                            </div>
                            <div className="dock-info">
                                <span className="dock-value">{gamification?.currentLevel || 1}</span>
                                <span className="dock-label">Level</span>
                            </div>
                        </div>
                        <div className="dock-stat">
                            <div className="dock-icon text-success">
                                <Activity size={16} />
                            </div>
                            <div className="dock-info">
                                <span className="dock-value">{stats?.resumeStats?.avgAtsScore || 0}%</span>
                                <span className="dock-label">Avg ATS</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-dock-actions">
                        <Link to="/candidate/resumes/upload" className="btn btn-glow btn-sm">
                            <UploadCloud size={16} className="pulse-icon" />
                            Upload
                        </Link>
                        <Link to="/candidate/matches" className="btn btn-glass btn-sm">
                            <Zap size={16} />
                            Matches
                        </Link>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-cards">
                    <div className="xp-card loading"></div>
                    <div className="stats-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="stat-card loading"></div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <XPProgress user={gamification} />

                    <div className="dashboard-layout-grid">
                        <div className="main-stats-column">
                            <div className="recent-activity-section">
                                <div className="section-header">
                                    <h2>Activity Analytics</h2>
                                </div>
                                <ActivityChart data={gamification?.weeklyActivity} />
                            </div>
                        </div>

                        <div className="sidebar-column">
                            <DailyChallenge completed={gamification?.dailyChallengeCompleted} />

                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2>Quick Actions</h2>
                                </div>
                                <div className="quick-actions">
                                    <Link to="/candidate/resumes/upload" className="action-card">
                                        <UploadCloud size={24} />
                                        <span>Upload Resume</span>
                                    </Link>
                                    <Link to="/candidate/jobs" className="action-card">
                                        <BriefcaseBusiness size={24} />
                                        <span>Browse Jobs</span>
                                    </Link>
                                    <Link to="/candidate/matches" className="action-card">
                                        <Zap size={24} />
                                        <span>View Matches</span>
                                    </Link>
                                    <Link to="/candidate/chat" className="action-card">
                                        <BotMessageSquare size={24} />
                                        <span>AI Advisor</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2>Recent Applications</h2>
                                    <Link to="/candidate/applications" className="view-all">
                                        View All <ChevronRight size={16} />
                                    </Link>
                                </div>
                                <div className="section-content">
                                    {stats?.recentApplications?.length > 0 ? (
                                        <div className="applications-list">
                                            {stats.recentApplications.map((app, index) => (
                                                <div key={index} className="application-item">
                                                    <div className="app-info">
                                                        <strong>{app.job?.title}</strong>
                                                        <span>{app.job?.company}</span>
                                                    </div>
                                                    <span className={`status-badge ${app.status.toLowerCase()}`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <p>No applications yet.</p>
                                            <Link to="/candidate/jobs" className="btn btn-sm btn-secondary">
                                                Find Jobs
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Resumes Page
const ResumesPage = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        try {
            const response = await resumeAPI.getAll();
            setResumes(response.data.resumes);
        } catch (error) {
            toast.error('Failed to load resumes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1>My Resumes</h1>
                    <p>Manage your uploaded resumes</p>
                </div>
                <Link to="/candidate/resumes/upload" className="btn btn-primary">
                    <UploadCloud size={18} />
                    Upload New
                </Link>
            </div>

            {loading ? (
                <div className="loading-cards">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="resume-card loading"></div>
                    ))}
                </div>
            ) : resumes.length > 0 ? (
                <div className="resumes-grid">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="resume-card">
                            <div className="resume-icon">
                                <FileStack size={32} />
                            </div>
                            <div className="resume-info">
                                <h3>{resume.title}</h3>
                                <p>{resume.originalFileName}</p>
                                <div className="resume-meta">
                                    <span className="ats-score">
                                        ATS Score: {resume.atsScore || 'Analyzing...'}%
                                    </span>
                                    <span className="date">
                                        {new Date(resume.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="resume-actions">
                                <Link to={`/candidate/resumes/${resume.id}`} className="btn btn-secondary btn-sm">
                                    View Analysis
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state-large">
                    <FileText size={64} />
                    <h2>No resumes yet</h2>
                    <p>Upload your first resume to get AI-powered insights</p>
                    <Link to="/candidate/resumes/upload" className="btn btn-primary">
                        <UploadCloud size={18} />
                        Upload Resume
                    </Link>
                </div>
            )}
        </div>
    );
};

// Upload Resume Page
const UploadResumePage = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && isValidFile(droppedFile)) {
            setFile(droppedFile);
            setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && isValidFile(selectedFile)) {
            setFile(selectedFile);
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const isValidFile = (file) => {
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a PDF or Word document');
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return false;
        }
        return true;
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('title', title);

        try {
            await resumeAPI.upload(formData);
            toast.success('Resume uploaded! AI analysis in progress...');
            navigate('/candidate/resumes');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1>Upload Resume</h1>
                    <p>Upload your resume for AI-powered analysis</p>
                </div>
            </div>

            <div className="upload-container">
                <form onSubmit={handleUpload}>
                    <div
                        className={`upload-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="file-preview">
                                <FileStack size={48} />
                                <span className="file-name">{file.name}</span>
                                <button
                                    type="button"
                                    className="remove-file"
                                    onClick={() => setFile(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <UploadCloud size={48} />
                                <h3>Drag & drop your resume here</h3>
                                <p>or click to browse files</p>
                                <span className="file-types">PDF, DOC, DOCX up to 10MB</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="file-input"
                        />
                    </div>

                    {file && (
                        <div className="upload-form">
                            <div className="form-group">
                                <label htmlFor="title">Resume Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Software Developer Resume"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    <>
                                        <PenTool size={18} />
                                        Analyze Resume
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

// Placeholder pages
const JobsPage = () => (
    <div className="dashboard-content">
        <div className="dashboard-header">
            <h1>Browse Jobs</h1>
            <p>Find jobs that match your skills</p>
        </div>
        <div className="coming-soon">
            <BriefcaseBusiness size={64} />
            <h2>Jobs Browser</h2>
            <p>Browse and apply to jobs matching your profile.</p>
        </div>
    </div>
);

const MatchesPage = () => (
    <div className="dashboard-content">
        <div className="dashboard-header">
            <h1>Job Matches</h1>
            <p>AI-matched jobs for your profile</p>
        </div>
        <div className="coming-soon">
            <Zap size={64} />
            <h2>Your Matches</h2>
            <p>View jobs matched to your resume skills and experience.</p>
        </div>
    </div>
);

const SettingsPage = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <h1>Settings</h1>
                <p>Manage your account settings</p>
            </div>
            <div className="settings-container">
                <div className="settings-section">
                    <h2>Profile Information</h2>
                    <div className="settings-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input type="text" defaultValue={user?.firstName} />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input type="text" defaultValue={user?.lastName} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" defaultValue={user?.email} disabled />
                        </div>
                        <button className="btn btn-primary">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Dashboard Component
const CandidateDashboard = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navGroups = [
        {
            label: 'Dashboard',
            path: '/candidate',
            exact: true
        },
        {
            label: 'Resumes',
            path: '/candidate/resumes',
            items: [
                { path: '/candidate/resumes', label: 'My Resumes', icon: <FileStack size={18} /> },
                { path: '/candidate/builder', label: 'Resume Builder', icon: <PenTool size={18} /> },
                { path: '/candidate/resumes/upload', label: 'Upload New', icon: <UploadCloud size={18} /> }
            ]
        },
        {
            label: 'Jobs',
            path: '/candidate/jobs',
            items: [
                { path: '/candidate/jobs', label: 'Browse Jobs', icon: <BriefcaseBusiness size={18} /> },
                { path: '/candidate/matches', label: 'Job Matches', icon: <Zap size={18} /> },
                { path: '/candidate/saved', label: 'Saved Jobs', icon: <Bookmark size={18} /> },
                { path: '/candidate/applications', label: 'Applications', icon: <Send size={18} /> }
            ]
        },
        {
            label: 'Interviews',
            path: '/candidate/interviews'
        },
        {
            label: 'Messages',
            path: '/candidate/messages'
        },
        {
            label: 'AI Advisor',
            path: '/candidate/chat'
        },
        {
            label: 'Practice',
            path: '/candidate/quiz',
            items: [
                { path: '/candidate/quiz', label: 'Quiz Practice', icon: <BrainCircuit size={18} /> },
                { path: '/candidate/interview', label: 'Mock Interview', icon: <MessageSquare size={18} /> }
            ]
        },
        {
            label: 'Settings',
            path: '/candidate/settings'
        }
    ];

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <DashboardLayout navGroups={navGroups}>
            <div className="content-wrapper">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/resumes" element={<ResumesPage />} />
                    <Route path="/resumes/upload" element={<UploadResumePage />} />
                    <Route path="/resumes/:id" element={<ResumeDetail />} />
                    <Route path="/builder" element={<ResumeBuilder />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/jobs/:id" element={<JobDetail />} />
                    <Route path="/saved" element={<SavedJobs />} />
                    <Route path="/applications" element={<Applications />} />
                    <Route path="/interviews" element={<Interviews />} />
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/quiz" element={<QuizPractice />} />
                    <Route path="/interview" element={<InterviewPractice />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </div>
        </DashboardLayout>
    );
};

export default CandidateDashboard;
