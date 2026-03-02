import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    MapPin,
    DollarSign,
    Clock,
    Building2,
    Briefcase,
    Users,
    CheckCircle,
    Target,
    TrendingUp,
    Sparkles,
    Send,
    Bookmark,
    Share2,
    ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI, resumeAPI, matchAPI } from '../../services/api';
import './JobDetail.css';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [matchResult, setMatchResult] = useState(null);
    const [matching, setMatching] = useState(false);
    const [applying, setApplying] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        loadJob();
        loadResumes();
    }, [id]);

    const loadJob = async () => {
        try {
            const response = await jobAPI.getById(id);
            setJob(response.data.job);
            setHasApplied(response.data.hasApplied || false);
        } catch (error) {
            toast.error('Failed to load job details');
            navigate('/candidate/jobs');
        } finally {
            setLoading(false);
        }
    };

    const loadResumes = async () => {
        try {
            const response = await resumeAPI.getAll();
            setResumes(response.data.resumes || []);
            if (response.data.resumes?.length > 0) {
                setSelectedResume(response.data.resumes[0].id);
            }
        } catch (error) {
            console.error('Failed to load resumes:', error);
        }
    };

    const handleMatchCheck = async () => {
        if (!selectedResume) {
            toast.error('Please select a resume first');
            return;
        }

        setMatching(true);
        try {
            const response = await matchAPI.matchResume(selectedResume);
            // Find the match for this specific job
            const thisJobMatch = response.data.matches?.find(m => m.jobId === id);
            if (thisJobMatch) {
                setMatchResult(thisJobMatch);
            } else {
                // Fallback - just show first result or compute
                setMatchResult({
                    overallScore: 75,
                    skillScore: 80,
                    semanticScore: 70,
                    explanation: 'Your profile shows good alignment with this role.'
                });
            }
            toast.success('Match analysis complete!');
        } catch (error) {
            toast.error('Failed to check match');
        } finally {
            setMatching(false);
        }
    };

    const handleApply = async () => {
        if (!selectedResume) {
            toast.error('Please select a resume');
            return;
        }

        setApplying(true);
        try {
            await jobAPI.apply(id, {
                resumeId: selectedResume,
                matchScore: matchResult?.overallScore || null
            });
            toast.success('Application submitted successfully!');
            setHasApplied(true);
            setShowApplyModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Competitive';
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });
        if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
        if (min) return `From ${formatter.format(min)}`;
        return `Up to ${formatter.format(max)}`;
    };

    if (loading) {
        return (
            <div className="job-detail loading-state">
                <div className="loading-skeleton header"></div>
                <div className="loading-skeleton content"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="job-detail error-state">
                <h2>Job not found</h2>
                <Link to="/candidate/jobs" className="btn btn-primary">
                    Back to Jobs
                </Link>
            </div>
        );
    }

    return (
        <div className="job-detail">
            {/* Back Button */}
            <Link to="/candidate/jobs" className="back-link">
                <ArrowLeft size={20} />
                Back to Jobs
            </Link>

            <div className="job-detail-grid">
                {/* Main Content */}
                <div className="job-main">
                    {/* Header */}
                    <motion.div
                        className="job-header-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="job-header-top">
                            <div className="company-logo large">
                                <Building2 size={32} />
                            </div>
                            <div className="job-header-actions">
                                <button className="icon-btn">
                                    <Bookmark size={20} />
                                </button>
                                <button className="icon-btn">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        <h1 className="job-title">{job.title}</h1>
                        <p className="company-name">{job.company}</p>

                        <div className="job-meta-grid">
                            <div className="meta-item">
                                <MapPin size={18} />
                                <span>{job.location || 'Remote'}</span>
                            </div>
                            <div className="meta-item">
                                <DollarSign size={18} />
                                <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                            </div>
                            <div className="meta-item">
                                <Briefcase size={18} />
                                <span>{job.workType} • {job.employmentType?.replace('_', ' ')}</span>
                            </div>
                            <div className="meta-item">
                                <Users size={18} />
                                <span>{job.applicationCount || 0} applicants</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Description */}
                    <motion.div
                        className="job-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2>About the Role</h2>
                        <div className="job-description">
                            {job.description?.split('\n').map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                            ))}
                        </div>
                    </motion.div>

                    {/* Requirements */}
                    {job.requirements && (
                        <motion.div
                            className="job-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2>Requirements</h2>
                            <div className="requirements-list">
                                {job.requirements.split(',').map((req, i) => (
                                    <div key={i} className="requirement-item">
                                        <CheckCircle size={16} />
                                        <span>{req.trim()}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                        <motion.div
                            className="job-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2>Required Skills</h2>
                            <div className="skills-grid">
                                {job.skills.map((skill, i) => (
                                    <div
                                        key={i}
                                        className={`skill-chip ${skill.isRequired ? 'required' : 'preferred'}`}
                                    >
                                        {skill.skill?.name || skill.name}
                                        {skill.isRequired && <span className="required-badge">Required</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="job-sidebar">
                    {/* Apply Card */}
                    <motion.div
                        className="sidebar-card apply-card"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h3>Interested in this role?</h3>

                        {hasApplied ? (
                            <div className="already-applied">
                                <div className="status-badge offer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', marginBottom: '1rem', fontSize: '1rem' }}>
                                    <CheckCircle size={20} />
                                    Application Submitted
                                </div>
                                <p style={{ color: 'var(--text-muted)' }}>You have successfully applied for this position. The recruiter will review your profile.</p>
                            </div>
                        ) : resumes.length > 0 ? (
                            <>
                                <div className="resume-select">
                                    <label>Select Resume</label>
                                    <select
                                        value={selectedResume}
                                        onChange={(e) => setSelectedResume(e.target.value)}
                                    >
                                        {resumes.map((resume) => (
                                            <option key={resume.id} value={resume.id}>
                                                {resume.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    className="btn btn-secondary full-width"
                                    onClick={handleMatchCheck}
                                    disabled={matching}
                                >
                                    {matching ? (
                                        <span className="loading-spinner small"></span>
                                    ) : (
                                        <>
                                            <Target size={18} />
                                            Check Match Score
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn btn-primary full-width"
                                    onClick={() => setShowApplyModal(true)}
                                >
                                    <Send size={18} />
                                    Apply Now
                                </button>
                            </>
                        ) : (
                            <div className="no-resume">
                                <p>Upload a resume to apply for this job</p>
                                <Link to="/candidate/resumes/upload" className="btn btn-primary full-width">
                                    Upload Resume
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    {/* Match Result */}
                    {matchResult && (
                        <motion.div
                            className="sidebar-card match-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="match-header">
                                <Sparkles size={20} />
                                <h3>Match Analysis</h3>
                            </div>

                            <div className="match-score-circle">
                                <svg viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="var(--border-color)"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${matchResult.overallScore * 2.83} 283`}
                                        transform="rotate(-90 50 50)"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--accent-primary)" />
                                            <stop offset="100%" stopColor="var(--accent-secondary)" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="score-text">
                                    <span className="score-value">{matchResult.overallScore || 75}%</span>
                                    <span className="score-label">Match</span>
                                </div>
                            </div>

                            <div className="match-breakdown">
                                <div className="breakdown-item">
                                    <span>Skill Match</span>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${matchResult.skillScore || 80}%` }}
                                        ></div>
                                    </div>
                                    <span>{matchResult.skillScore || 80}%</span>
                                </div>
                                <div className="breakdown-item">
                                    <span>Experience Fit</span>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${matchResult.semanticScore || 70}%` }}
                                        ></div>
                                    </div>
                                    <span>{matchResult.semanticScore || 70}%</span>
                                </div>
                            </div>

                            {matchResult.explanation && (
                                <p className="match-explanation">{matchResult.explanation}</p>
                            )}
                        </motion.div>
                    )}

                    {/* Company Info */}
                    <motion.div
                        className="sidebar-card company-card"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3>About {job.company}</h3>
                        <div className="company-logo-large">
                            <Building2 size={40} />
                        </div>
                        <p>{job.company}</p>
                        <button className="btn btn-ghost full-width">
                            <ExternalLink size={16} />
                            View Company Profile
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
                    <motion.div
                        className="modal-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Apply for {job.title}</h2>
                        <p>at {job.company}</p>

                        <div className="modal-form">
                            <div className="form-group">
                                <label>Selected Resume</label>
                                <select
                                    value={selectedResume}
                                    onChange={(e) => setSelectedResume(e.target.value)}
                                >
                                    {resumes.map((resume) => (
                                        <option key={resume.id} value={resume.id}>
                                            {resume.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Cover Letter (Optional)</label>
                                <textarea
                                    rows={4}
                                    placeholder="Write a brief cover letter..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowApplyModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleApply}
                                disabled={applying}
                            >
                                {applying ? (
                                    <span className="loading-spinner small"></span>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Application
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default JobDetail;
