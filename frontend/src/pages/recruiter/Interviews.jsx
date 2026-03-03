import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Video,
    Phone,
    Building,
    Users,
    FileText,
    User,
    Mail,
    Plus,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    MessageSquare,
    Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './Interviews.css';

const Interviews = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'calendar'
    const [filter, setFilter] = useState('upcoming');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [applications, setApplications] = useState([]);
    const [formData, setFormData] = useState({
        applicationId: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        type: 'VIDEO',
        notes: ''
    });

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackData, setFeedbackData] = useState({
        interviewId: '',
        technicalRating: 0,
        culturalFitRating: 0,
        communicationRating: 0,
        notes: ''
    });

    useEffect(() => {
        fetchInterviews();
    }, [filter]);

    useEffect(() => {
        if (showScheduleModal) {
            fetchApplications();
        }
    }, [showScheduleModal]);

    const fetchApplications = async () => {
        try {
            const response = await api.get('/jobs/applications');
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Failed to fetch applications', error);
        }
    };


    const fetchInterviews = async () => {
        try {
            const params = filter === 'upcoming'
                ? { upcoming: 'true' }
                : filter === 'all' ? {} : { status: filter.toUpperCase() };
            const response = await api.get('/interviews', { params });
            setInterviews(response.data.interviews || []);
        } catch (error) {
            console.error('Failed to fetch interviews:', error);
            toast.error('Failed to load interviews.');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.scheduledDate || !formData.scheduledTime) {
            toast.error("Please enter both date and time");
            return;
        }

        try {
            const submitData = {
                ...formData,
                scheduledAt: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()
            };

            await api.post('/interviews', submitData);
            toast.success('Interview scheduled successfully');
            setShowScheduleModal(false);
            fetchInterviews();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to schedule interview');
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

    const handleUpdateStatus = async (id, status) => {
        if (status === 'COMPLETED') {
            setFeedbackData({
                interviewId: id,
                technicalRating: 0,
                culturalFitRating: 0,
                communicationRating: 0,
                notes: ''
            });
            setShowFeedbackModal(true);
            return;
        }

        try {
            await api.patch(`/interviews/${id}`, { status });
            setInterviews(prev => prev.map(i =>
                i.id === id ? { ...i, status } : i
            ));
            toast.success(`Interview marked as ${statusConfig[status].label}`);
        } catch (error) {
            toast.error('Failed to update interview');
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            // Calculate overall rating
            const overallRating = Math.round(
                (feedbackData.technicalRating + feedbackData.culturalFitRating + feedbackData.communicationRating) / 3
            );

            await api.patch(`/interviews/${feedbackData.interviewId}`, {
                status: 'COMPLETED',
                technicalRating: feedbackData.technicalRating,
                culturalFitRating: feedbackData.culturalFitRating,
                communicationRating: feedbackData.communicationRating,
                rating: overallRating,
                feedback: feedbackData.notes
            });

            setInterviews(prev => prev.map(i =>
                i.id === feedbackData.interviewId ? {
                    ...i,
                    status: 'COMPLETED',
                    technicalRating: feedbackData.technicalRating,
                    culturalFitRating: feedbackData.culturalFitRating,
                    communicationRating: feedbackData.communicationRating,
                    rating: overallRating,
                    feedback: feedbackData.notes
                } : i
            ));

            toast.success('Interview completed and feedback saved');
            setShowFeedbackModal(false);
        } catch (error) {
            toast.error('Failed to save feedback');
        }
    };

    const RatingStars = ({ rating, setRating }) => {
        return (
            <div className="star-rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= rating ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                    >
                        <Star size={20} className={star <= rating ? 'filled' : ''} />
                    </button>
                ))}
                <span className="rating-value">{rating > 0 ? `${rating}/5` : 'Required'}</span>
            </div>
        );
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this interview?')) return;

        try {
            await api.delete(`/interviews/${id}`);
            setInterviews(prev => prev.filter(i => i.id !== id));
            toast.success('Interview deleted');
        } catch (error) {
            toast.error('Failed to delete interview');
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isUpcoming = (date) => new Date(date) > new Date();

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={14}
                className={i < rating ? 'filled' : ''}
            />
        ));
    };

    if (loading) {
        return (
            <div className="interviews-loading">
                <div className="loader"></div>
                <p>Loading interviews...</p>
            </div>
        );
    }

    return (
        <div className="interviews-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><Calendar size={28} /> Interview Schedule</h1>
                    <p>Manage and track all your interviews</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
                    <Plus size={18} /> Schedule Interview
                </button>
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
                <div className="view-toggle">
                    <button
                        className={`view-btn ${view === 'list' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                    >
                        List
                    </button>
                    <button
                        className={`view-btn ${view === 'calendar' ? 'active' : ''}`}
                        onClick={() => setView('calendar')}
                    >
                        Calendar
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

                                    <div className="interview-candidate">
                                        <div className="candidate-avatar">
                                            {interview.application.candidate.avatar ? (
                                                <img src={interview.application.candidate.avatar} alt="" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="candidate-info">
                                            <div className="candidate-name">
                                                {interview.application.candidate.firstName} {interview.application.candidate.lastName}
                                            </div>
                                            <div className="candidate-email">
                                                <Mail size={12} />
                                                {interview.application.candidate.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="interview-job">
                                        <Building size={14} />
                                        {interview.application.job.title} at {interview.application.job.company}
                                    </div>

                                    <div className="interview-details">
                                        <span className="detail-item">
                                            <Clock size={14} />
                                            {interview.duration} min
                                        </span>
                                        {interview.meetingLink && (
                                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="meeting-link">
                                                <Video size={14} />
                                                Join Meeting
                                            </a>
                                        )}
                                    </div>

                                    {interview.notes && (
                                        <div className="interview-notes">
                                            <MessageSquare size={14} />
                                            {interview.notes}
                                        </div>
                                    )}

                                    {interview.feedback && (
                                        <div className="interview-feedback">
                                            <div className="feedback-header">
                                                <span>Feedback</span>
                                                <div className="rating">
                                                    {renderStars(interview.rating)}
                                                </div>
                                            </div>
                                            <p>{interview.feedback}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="interview-actions">
                                    {upcoming && interview.status === 'SCHEDULED' && (
                                        <>
                                            <button
                                                className="action-btn confirm"
                                                onClick={() => handleUpdateStatus(interview.id, 'CONFIRMED')}
                                                title="Mark as Confirmed"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                className="action-btn reschedule"
                                                onClick={() => setSelectedInterview(interview)}
                                                title="Reschedule"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="action-btn cancel"
                                                onClick={() => handleUpdateStatus(interview.id, 'CANCELLED')}
                                                title="Cancel"
                                            >
                                                <X size={16} />
                                            </button>
                                        </>
                                    )}
                                    {upcoming && interview.status === 'CONFIRMED' && (
                                        <button
                                            className="action-btn complete"
                                            onClick={() => handleUpdateStatus(interview.id, 'COMPLETED')}
                                            title="Mark as Completed"
                                        >
                                            <Check size={16} /> Complete
                                        </button>
                                    )}
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleDelete(interview.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <Calendar size={48} />
                    <h3>No interviews scheduled</h3>
                    <p>Schedule interviews with candidates to see them here</p>
                </div>
            )}

            {/* Schedule Modal */}
            <AnimatePresence>
                {showScheduleModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowScheduleModal(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Schedule Interview</h2>
                                <button className="close-btn" onClick={() => setShowScheduleModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleScheduleSubmit} className="schedule-form">
                                <div className="form-group">
                                    <label>Candidate & Job</label>
                                    <select
                                        required
                                        value={formData.applicationId}
                                        onChange={e => setFormData({ ...formData, applicationId: e.target.value })}
                                        className="form-control"
                                    >
                                        <option value="">Select Candidate...</option>
                                        {applications.map(app => (
                                            <option key={app.id} value={app.id}>
                                                {app.candidate?.firstName} {app.candidate?.lastName} - {app.job?.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group-row">
                                    <div className="form-group col-4">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.scheduledDate}
                                            onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group col-4">
                                        <label>Time</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.scheduledTime}
                                            onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="form-group col-4">
                                        <label>Duration (mins)</label>
                                        <input
                                            type="number"
                                            required
                                            min="15"
                                            step="15"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            className="form-control"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Interview Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="form-control"
                                    >
                                        <option value="VIDEO">Video Call (Auto Jitsi link)</option>
                                        <option value="PHONE">Phone Call</option>
                                        <option value="ONSITE">On-site</option>
                                        <option value="TECHNICAL">Technical</option>
                                        <option value="HR">HR Round</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Notes (Optional)</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Add instructions or external meeting link..."
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="form-control"
                                    ></textarea>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFeedbackModal(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Complete Interview & Feedback</h2>
                                <button className="close-btn" onClick={() => setShowFeedbackModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                                <div className="form-group">
                                    <label>Technical Skills</label>
                                    <RatingStars
                                        rating={feedbackData.technicalRating}
                                        setRating={(r) => setFeedbackData({ ...feedbackData, technicalRating: r })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Cultural Fit</label>
                                    <RatingStars
                                        rating={feedbackData.culturalFitRating}
                                        setRating={(r) => setFeedbackData({ ...feedbackData, culturalFitRating: r })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Communication</label>
                                    <RatingStars
                                        rating={feedbackData.communicationRating}
                                        setRating={(r) => setFeedbackData({ ...feedbackData, communicationRating: r })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Internal Notes</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Add detailed feedback and recommendations..."
                                        value={feedbackData.notes}
                                        onChange={e => setFeedbackData({ ...feedbackData, notes: e.target.value })}
                                        className="form-control"
                                        required
                                    ></textarea>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!feedbackData.technicalRating || !feedbackData.culturalFitRating || !feedbackData.communicationRating}
                                    >
                                        Save & Complete
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Interviews;
