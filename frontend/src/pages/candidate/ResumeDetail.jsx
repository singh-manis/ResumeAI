import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
    Target,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Sparkles,
    Download,
    Trash2,
    RefreshCw,
    Award,
    Briefcase,
    GraduationCap,
    Code,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeAPI, matchAPI } from '../../services/api';
import './ResumeDetail.css';

const ResumeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resume, setResume] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [matches, setMatches] = useState([]);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadResume();
    }, [id]);

    const loadResume = async () => {
        try {
            const [resumeRes, analysisRes] = await Promise.all([
                resumeAPI.getById(id),
                resumeAPI.getAnalysis(id).catch(() => null)
            ]);
            setResume(resumeRes.data.resume);
            setAnalysis(analysisRes?.data?.analysis || null);
        } catch (error) {
            toast.error('Failed to load resume');
            navigate('/candidate/resumes');
        } finally {
            setLoading(false);
        }
    };

    const handleFindMatches = async () => {
        setMatching(true);
        try {
            const response = await matchAPI.matchResume(id);
            setMatches(response.data.matches || []);
            toast.success(`Found ${response.data.matches?.length || 0} matching jobs!`);
        } catch (error) {
            toast.error('Failed to find matches');
        } finally {
            setMatching(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this resume?')) return;

        setDeleting(true);
        try {
            await resumeAPI.delete(id);
            toast.success('Resume deleted');
            navigate('/candidate/resumes');
        } catch (error) {
            toast.error('Failed to delete resume');
        } finally {
            setDeleting(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    };

    if (loading) {
        return (
            <div className="resume-detail loading-state">
                <div className="loading-skeleton header"></div>
                <div className="loading-skeleton content"></div>
            </div>
        );
    }

    if (!resume) {
        return (
            <div className="resume-detail error-state">
                <h2>Resume not found</h2>
                <Link to="/candidate/resumes" className="btn btn-primary">
                    Back to Resumes
                </Link>
            </div>
        );
    }

    return (
        <div className="resume-detail">
            {/* Back Button */}
            <Link to="/candidate/resumes" className="back-link">
                <ArrowLeft size={20} />
                Back to Resumes
            </Link>

            <div className="resume-detail-grid">
                {/* Main Content */}
                <div className="resume-main">
                    {/* Header */}
                    <motion.div
                        className="resume-header-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="resume-header-top">
                            <div className="file-icon">
                                <FileText size={32} />
                            </div>
                            <div className="resume-actions">
                                <button className="icon-btn" title="Download">
                                    <Download size={20} />
                                </button>
                                <button
                                    className="icon-btn danger"
                                    title="Delete"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        <h1>{resume.title}</h1>
                        <p className="file-name">{resume.originalFileName}</p>

                        <div className="resume-meta">
                            <span><Calendar size={16} /> Uploaded {new Date(resume.createdAt).toLocaleDateString()}</span>
                            {resume.parsedData?.contact?.email && (
                                <span><Mail size={16} /> {resume.parsedData.contact.email}</span>
                            )}
                        </div>
                    </motion.div>

                    {/* ATS Score Card */}
                    <motion.div
                        className="ats-score-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="ats-header">
                            <div>
                                <h2><Award size={20} /> ATS Compatibility Score</h2>
                                <p>How well your resume performs with Applicant Tracking Systems</p>
                            </div>
                        </div>

                        <div className="ats-score-display">
                            <div className={`score-circle ${getScoreColor(resume.atsScore || 0)}`}>
                                <svg viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="var(--border-color)"
                                        strokeWidth="10"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(resume.atsScore || 0) * 2.83} 283`}
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="score-content">
                                    <span className="score-number">{resume.atsScore || 0}</span>
                                    <span className="score-max">/100</span>
                                </div>
                            </div>

                            <div className="score-breakdown">
                                {resume.atsBreakdown && Object.entries(resume.atsBreakdown).map(([key, value]) => (
                                    <div key={key} className="breakdown-row">
                                        <span className="breakdown-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                        <div className="breakdown-bar">
                                            <div
                                                className="breakdown-fill"
                                                style={{ width: `${(value / 25) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="breakdown-value">{value}/25</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Suggestions */}
                        {resume.atsSuggestions && resume.atsSuggestions.length > 0 && (
                            <div className="suggestions-section">
                                <h3><Zap size={18} /> Improvement Suggestions</h3>
                                <ul className="suggestions-list">
                                    {resume.atsSuggestions.map((suggestion, i) => (
                                        <li key={i}>
                                            <AlertCircle size={16} />
                                            <span>{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>

                    {/* Skills Section */}
                    {resume.skills && resume.skills.length > 0 && (
                        <motion.div
                            className="section-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2><Code size={20} /> Extracted Skills</h2>
                            <div className="skills-container">
                                {resume.skills.map((skillItem, i) => (
                                    <div key={i} className="skill-badge">
                                        <span className="skill-name">
                                            {skillItem.skill?.name || skillItem.name || skillItem}
                                        </span>
                                        {skillItem.proficiency && (
                                            <span className={`proficiency ${skillItem.proficiency.toLowerCase()}`}>
                                                {skillItem.proficiency}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Experience Section */}
                    {resume.experiences && resume.experiences.length > 0 && (
                        <motion.div
                            className="section-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2><Briefcase size={20} /> Work Experience</h2>
                            <div className="timeline">
                                {resume.experiences.map((exp, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-marker"></div>
                                        <div className="timeline-content">
                                            <h3>{exp.title}</h3>
                                            <p className="company">{exp.company}</p>
                                            <p className="dates">
                                                {exp.startDate} - {exp.endDate || 'Present'}
                                                {exp.location && ` • ${exp.location}`}
                                            </p>
                                            {exp.description && <p className="description">{exp.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Education Section */}
                    {resume.education && resume.education.length > 0 && (
                        <motion.div
                            className="section-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2><GraduationCap size={20} /> Education</h2>
                            <div className="timeline">
                                {resume.education.map((edu, i) => (
                                    <div key={i} className="timeline-item">
                                        <div className="timeline-marker"></div>
                                        <div className="timeline-content">
                                            <h3>{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                                            <p className="company">{edu.institution}</p>
                                            <p className="dates">
                                                {edu.startDate} - {edu.endDate || 'Present'}
                                                {edu.gpa && ` • GPA: ${edu.gpa}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="resume-sidebar">
                    {/* Match Jobs Card */}
                    <motion.div
                        className="sidebar-card match-card"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="match-card-header">
                            <Sparkles size={24} />
                            <h3>Find Matching Jobs</h3>
                        </div>
                        <p>Let AI find jobs that match your skills and experience</p>
                        <button
                            className="btn btn-primary full-width"
                            onClick={handleFindMatches}
                            disabled={matching}
                        >
                            {matching ? (
                                <>
                                    <RefreshCw size={18} className="spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Target size={18} />
                                    Find Matches
                                </>
                            )}
                        </button>
                    </motion.div>

                    {/* Matches List */}
                    {matches.length > 0 && (
                        <motion.div
                            className="sidebar-card matches-list"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <h3>Top Matching Jobs</h3>
                            <div className="matches-container">
                                {matches.slice(0, 5).map((match, i) => (
                                    <Link
                                        key={i}
                                        to={`/candidate/jobs/${match.jobId}`}
                                        className="match-item"
                                    >
                                        <div className="match-info">
                                            <strong>{match.job?.title || 'Job'}</strong>
                                            <span>{match.job?.company}</span>
                                        </div>
                                        <div className={`match-score ${getScoreColor(match.overallScore)}`}>
                                            {match.overallScore}%
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Link to="/candidate/matches" className="view-all-link">
                                View All Matches →
                            </Link>
                        </motion.div>
                    )}

                    {/* Quick Stats */}
                    <motion.div
                        className="sidebar-card stats-card"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3>Resume Stats</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-value">{resume.skills?.length || 0}</span>
                                <span className="stat-label">Skills</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{resume.experiences?.length || 0}</span>
                                <span className="stat-label">Jobs</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{resume.education?.length || 0}</span>
                                <span className="stat-label">Education</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{matches.length}</span>
                                <span className="stat-label">Matches</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ResumeDetail;
