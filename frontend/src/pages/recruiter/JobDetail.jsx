import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BriefcaseBusiness,
    MapPin,
    DollarSign,
    Clock,
    UsersRound,
    Trash2,
    Edit2,
    AlertTriangle,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI } from '../../services/api';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadJob();
    }, [id]);

    const loadJob = async () => {
        try {
            const response = await jobAPI.getById(id);
            setJob(response.data.job);
        } catch (error) {
            toast.error('Failed to load job details');
            navigate('/recruiter/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await jobAPI.delete(id);
            toast.success('Job deleted successfully');
            navigate('/recruiter/jobs');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete job');
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const toggleStatus = async () => {
        try {
            await jobAPI.toggleActive(id);
            setJob(prev => ({ ...prev, isActive: !prev.isActive }));
            toast.success(`Job marked as ${!job.isActive ? 'Active' : 'Closed'}`);
        } catch (error) {
            toast.error('Failed to update job status');
        }
    };

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Not disclosed';
        if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
        if (min) return `From $${min.toLocaleString()}`;
        return `Up to $${max.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="dashboard-content">
                <div className="loading-cards">
                    <div className="stat-card loading" style={{ height: 200 }} />
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="dashboard-content">
            {/* Header Actions */}
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/recruiter/jobs')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={18} /> Back to Jobs
                </button>

                <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={`btn ${job.isActive ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={toggleStatus}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {job.isActive ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                        {job.isActive ? 'Close Job' : 'Reactivate Job'}
                    </button>
                    {/* Hiding Edit for now since EditForm is not built yet */}
                    {/* <button className="btn btn-secondary"> <Edit2 size={18} /> Edit </button> */}
                    <button
                        className="btn btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.2)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Trash2 size={18} /> Delete Job
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 350px' }}>
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>{job.title}</h2>
                        <span className={`status-badge ${job.isActive ? 'offer' : 'rejected'}`}>
                            {job.isActive ? 'Active' : 'Closed'}
                        </span>
                    </div>

                    <div className="section-content" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <BriefcaseBusiness size={18} />
                                <span>{job.company}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <MapPin size={18} />
                                <span>{job.location || 'Remote'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <DollarSign size={18} />
                                <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <Clock size={18} />
                                <span>{job.workType} • {job.employmentType?.replace('_', ' ')}</span>
                            </div>
                        </div>

                        <div className="job-description">
                            <h3>Description</h3>
                            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                                {job.description}
                            </div>

                            {job.requirements && (
                                <>
                                    <h3>Requirements</h3>
                                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                                        {job.requirements}
                                    </div>
                                </>
                            )}

                            {job.skills?.length > 0 && (
                                <>
                                    <h3>Required Skills</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                        {job.skills.map((s, idx) => (
                                            <span key={idx} style={{
                                                padding: '0.4rem 1rem',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: 'var(--accent-primary)',
                                                borderRadius: '50px',
                                                fontSize: '0.9rem'
                                            }}>
                                                {s.skill?.name || s.name} {s.isRequired ? '★' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar Stats */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Job Performance</h2>
                    </div>
                    <div className="section-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="stat-card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                            <div className="stat-icon applications">
                                <UsersRound size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{job._count?.applications || 0}</span>
                                <span className="stat-label">Total Applicants</span>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
                            <div className="stat-icon score">
                                <Clock size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{new Date(job.createdAt).toLocaleDateString()}</span>
                                <span className="stat-label">Date Posted</span>
                            </div>
                        </div>

                        <Link to={`/recruiter/candidates?jobId=${job.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                            View Candidates
                        </Link>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" style={{ zIndex: 1000, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                        className="modal-content"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ef4444', marginBottom: '1rem' }}>
                            <AlertTriangle size={32} />
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Delete this Job?</h2>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
                            Are you sure you want to permanently delete <strong>{job.title}</strong>? This action cannot be undone and will remove all associated applications.
                        </p>
                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                style={{ background: '#ef4444', color: 'white', border: 'none' }}
                            >
                                {isDeleting ? 'Deleting...' : 'Yes, Delete Job'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default JobDetail;
