import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    Video,
    Phone,
    Building,
    Users,
    FileText,
    MessageSquare,
    CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
// Assuming we can reuse the recruiter's Interviews.css or add Candidate-specific styling.
// Since we don't know the exact relative path for css, let's just use inline or typical dashboard card classes.
// Wait, we can point to the recruiter's css file if needed, or create a copy. I'll point to recruiter css to save time.
import '../recruiter/Interviews.css';

const Interviews = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');

    useEffect(() => {
        fetchInterviews();
    }, [filter]);

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            const params = filter === 'upcoming'
                ? { upcoming: 'true' }
                : filter === 'all' ? {} : { status: filter.toUpperCase() };
            const response = await api.get('/interviews', { params });
            setInterviews(response.data.interviews || []);
        } catch (error) {
            console.error('Failed to fetch interviews:', error);
            toast.error('Failed to load your interviews.');
        } finally {
            setLoading(false);
        }
    };

    const typeConfig = {
        VIDEO: { icon: <Video size={16} />, label: 'Video Call', color: 'video' },
        PHONE: { icon: <Phone size={16} />, label: 'Phone Call', color: 'phone' },
        ONSITE: { icon: <Building size={16} />, label: 'On-site', color: 'onsite' },
        TECHNICAL: { icon: <FileText size={16} />, label: 'Technical', color: 'technical' },
        HR: { icon: <Users size={16} />, label: 'HR Round', color: 'hr' }
    };

    const statusConfig = {
        SCHEDULED: { label: 'Scheduled', color: 'scheduled' },
        CONFIRMED: { label: 'Confirmed', color: 'confirmed' },
        COMPLETED: { label: 'Completed', color: 'completed' },
        CANCELLED: { label: 'Cancelled', color: 'cancelled' },
        RESCHEDULED: { label: 'Rescheduled', color: 'rescheduled' },
        NO_SHOW: { label: 'No Show', color: 'no-show' }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isUpcoming = (date) => new Date(date) > new Date();

    if (loading) {
        return (
            <div className="interviews-loading dashboard-content">
                <div className="loader"></div>
                <p>Loading your interviews...</p>
            </div>
        );
    }

    return (
        <div className="interviews-page dashboard-content" style={{ padding: '0' }}>
            <div className="page-header">
                <div className="header-content">
                    <h1><Calendar size={28} /> My Interviews</h1>
                    <p>Track your upcoming and past job interviews</p>
                </div>
            </div>

            <div className="interviews-controls">
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed
                    </button>
                    <button
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                </div>
            </div>

            {interviews.length > 0 ? (
                <div className="interviews-list">
                    {interviews.map((interview, index) => {
                        const type = typeConfig[interview.type];
                        const status = statusConfig[interview.status];
                        const upcoming = isUpcoming(interview.scheduledAt);

                        return (
                            <motion.div
                                key={interview.id}
                                className={`interview-card ${upcoming ? 'upcoming' : 'past'}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="interview-date-block">
                                    <div className="date-day">
                                        {new Date(interview.scheduledAt).getDate()}
                                    </div>
                                    <div className="date-month">
                                        {new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
                                    </div>
                                    <div className="date-time">
                                        {formatTime(interview.scheduledAt)}
                                    </div>
                                </div>

                                <div className="interview-content">
                                    <div className="interview-header">
                                        <div className={`type-badge ${type.color}`}>
                                            {type.icon}
                                            {type.label}
                                        </div>
                                        <div className={`status-badge ${status.color}`}>
                                            {status.label}
                                        </div>
                                    </div>

                                    <div className="interview-job" style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                        <Building size={16} style={{ marginRight: '8px' }} />
                                        {interview.application.job.title}
                                        <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                            at {interview.application.job.company}
                                        </span>
                                    </div>

                                    <div className="interview-details" style={{ marginTop: '1rem' }}>
                                        <span className="detail-item">
                                            <Clock size={14} />
                                            {interview.duration} min
                                        </span>
                                        {interview.meetingLink && (
                                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="meeting-link btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                                                <Video size={14} />
                                                Join Meeting
                                            </a>
                                        )}
                                    </div>

                                    {interview.notes && (
                                        <div className="interview-notes" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                                            <MessageSquare size={14} style={{ marginBottom: '8px' }} />
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{interview.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <Calendar size={48} />
                    <h3>No interviews found</h3>
                    <p>When you get invited to an interview, it will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default Interviews;
