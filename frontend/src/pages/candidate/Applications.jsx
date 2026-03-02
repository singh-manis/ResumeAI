import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileStack,
    Building2,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    ChevronRight,
    Calendar,
    Video,
    Phone,
    UsersRound,
    Star,
    MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import './Applications.css';

const Applications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await api.get('/jobs/my-applications');
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
            setApplications([]);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        PENDING: { icon: <Clock size={16} />, label: 'Pending Review', color: 'pending', step: 1 },
        REVIEWED: { icon: <FileStack size={16} />, label: 'Under Review', color: 'reviewed', step: 2 },
        SHORTLISTED: { icon: <Star size={16} />, label: 'Shortlisted', color: 'shortlisted', step: 3 },
        INTERVIEW: { icon: <Video size={16} />, label: 'Interview', color: 'interview', step: 4 },
        OFFERED: { icon: <CheckCircle size={16} />, label: 'Offer Received', color: 'offered', step: 5 },
        REJECTED: { icon: <XCircle size={16} />, label: 'Not Selected', color: 'rejected', step: -1 },
        WITHDRAWN: { icon: <AlertCircle size={16} />, label: 'Withdrawn', color: 'withdrawn', step: -1 }
    };

    const interviewTypeIcons = {
        VIDEO: <Video size={14} />,
        PHONE: <Phone size={14} />,
        ONSITE: <Building2 size={14} />,
        TECHNICAL: <FileStack size={14} />,
        HR: <UsersRound size={14} />
    };

    const filters = [
        { value: 'ALL', label: 'All Applications' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'REVIEWED', label: 'Under Review' },
        { value: 'INTERVIEW', label: 'Interview' },
        { value: 'OFFERED', label: 'Offers' },
        { value: 'REJECTED', label: 'Rejected' }
    ];

    const filteredApplications = applications.filter(app => {
        const matchesFilter = filter === 'ALL' || app.status === filter;
        const matchesSearch =
            app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.job.company.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getTimeAgo = (date) => {
        const now = new Date();
        const d = new Date(date);
        const days = Math.floor((now - d) / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return d.toLocaleDateString();
    };

    const getUpcomingInterview = (interviews) => {
        if (!interviews?.length) return null;
        const upcoming = interviews.find(i =>
            i.status !== 'COMPLETED' && i.status !== 'CANCELLED' &&
            new Date(i.scheduledAt) > new Date()
        );
        return upcoming;
    };

    if (loading) {
        return (
            <div className="applications-loading">
                <div className="loader"></div>
                <p>Loading applications...</p>
            </div>
        );
    }

    return (
        <div className="applications-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><FileStack size={28} /> My Applications</h1>
                    <p>Track the status of your job applications</p>
                </div>
            </div>

            <div className="applications-controls">
                <div className="filter-tabs">
                    {filters.map(f => (
                        <button
                            key={f.value}
                            className={`filter-tab ${filter === f.value ? 'active' : ''}`}
                            onClick={() => setFilter(f.value)}
                        >
                            {f.label}
                            {f.value !== 'ALL' && (
                                <span className="count">
                                    {applications.filter(a => a.status === f.value).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredApplications.length > 0 ? (
                <div className="applications-list">
                    {filteredApplications.map((application, index) => {
                        const status = statusConfig[application.status];
                        const upcomingInterview = getUpcomingInterview(application.interviews);

                        return (
                            <motion.div
                                key={application.id}
                                className={`application-card ${status.color}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="application-header">
                                    <div className="company-logo">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="job-info">
                                        <Link to={`/candidate/jobs/${application.job.id}`} className="job-title">
                                            {application.job.title}
                                        </Link>
                                        <div className="job-company">
                                            {application.job.company} • {application.job.location}
                                        </div>
                                    </div>
                                    <div className={`status-badge ${status.color}`}>
                                        {status.icon}
                                        {status.label}
                                    </div>
                                </div>

                                {/* Progress Timeline */}
                                {status.step > 0 && (
                                    <div className="progress-timeline">
                                        {['Applied', 'Reviewed', 'Shortlist', 'Interview', 'Offer'].map((step, i) => (
                                            <div
                                                key={step}
                                                className={`timeline-step ${i + 1 <= status.step ? 'completed' : ''} ${i + 1 === status.step ? 'current' : ''}`}
                                            >
                                                <div className="step-dot"></div>
                                                <span className="step-label">{step}</span>
                                            </div>
                                        ))}
                                        <div className="timeline-line" style={{ width: `${((status.step - 1) / 4) * 100}%` }}></div>
                                    </div>
                                )}

                                {/* Upcoming Interview Alert */}
                                {upcomingInterview && (
                                    <div className="interview-alert">
                                        <Calendar size={16} />
                                        <span>
                                            <strong>Upcoming Interview:</strong>{' '}
                                            {new Date(upcomingInterview.scheduledAt).toLocaleDateString()} at{' '}
                                            {new Date(upcomingInterview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {interviewTypeIcons[upcomingInterview.type]}
                                        <span className="interview-type">{upcomingInterview.type}</span>
                                    </div>
                                )}

                                {/* AI Match Feedback */}
                                {application.matchAnalysis && application.matchAnalysis.candidateFeedback && (
                                    <div className="ai-feedback-alert" style={{
                                        padding: '12px 16px',
                                        margin: '0 20px 20px 20px',
                                        background: 'rgba(139, 92, 246, 0.05)',
                                        borderRadius: '8px',
                                        borderLeft: '4px solid var(--primary)',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start'
                                    }}>
                                        <Star size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} fill="currentColor" />
                                        <div>
                                            <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '4px', fontSize: '0.9rem' }}>AI Match Feedback</strong>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                                {application.matchAnalysis.candidateFeedback}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="application-footer">
                                    <div className="footer-left">
                                        <span className="applied-date">
                                            <Clock size={14} />
                                            Applied {getTimeAgo(application.appliedAt)}
                                        </span>
                                        {application.matchScore && (
                                            <span className="match-score">
                                                <Star size={14} />
                                                {application.matchScore}% match
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            className="btn"
                                            style={{
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: 'var(--primary-color)',
                                                border: 'none',
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onClick={() => {
                                                navigate('/candidate/messages', {
                                                    state: {
                                                        startChat: true,
                                                        otherUserId: application.job.recruiterId,
                                                        jobId: application.job.id
                                                    }
                                                });
                                            }}
                                        >
                                            <MessageSquare size={16} /> Message Recruiter
                                        </button>
                                        <Link to={`/candidate/jobs/${application.job.id}`} className="view-btn">
                                            View Details <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <FileStack size={48} />
                    <h3>No applications found</h3>
                    <p>Start applying to jobs to track your progress here</p>
                    <Link to="/candidate/jobs" className="btn btn-primary">
                        Browse Jobs
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Applications;
