import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Target,
    Briefcase,
    MapPin,
    DollarSign,
    TrendingUp,
    ArrowRight,
    FileText,
    RefreshCw,
    Sparkles,
    X,
    CheckCircle,
    BrainCircuit,
    AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { matchAPI, resumeAPI } from '../../services/api';
import './Matches.css';

const Matches = () => {
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        try {
            const response = await resumeAPI.getAll();
            setResumes(response.data.resumes || []);
            if (response.data.resumes?.length > 0) {
                setSelectedResume(response.data.resumes[0].id);
                loadMatches(response.data.resumes[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            toast.error('Failed to load resumes');
            setLoading(false);
        }
    };

    const loadMatches = async (resumeId) => {
        setLoading(true);
        try {
            const response = await matchAPI.matchResume(resumeId);
            setMatches(response.data.matches || []);
        } catch (error) {
            console.error('Failed to load matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResumeChange = (resumeId) => {
        setSelectedResume(resumeId);
        loadMatches(resumeId);
    };

    const handleRefresh = () => {
        if (selectedResume) {
            setMatching(true);
            loadMatches(selectedResume).finally(() => setMatching(false));
        }
    };

    const handleViewDetails = async (matchId) => {
        setDetailLoading(true);
        try {
            const response = await matchAPI.getMatchDetail(matchId);
            setSelectedMatch(response.data.match);
        } catch (error) {
            toast.error('Failed to load match details');
        } finally {
            setDetailLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
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

    if (resumes.length === 0 && !loading) {
        return (
            <div className="matches-page">
                <div className="matches-empty">
                    <FileText size={64} />
                    <h2>No Resumes Found</h2>
                    <p>Upload a resume first to see job matches</p>
                    <Link to="/candidate/resumes/upload" className="btn btn-primary">
                        Upload Resume
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="matches-page">
            {/* Header */}
            <div className="matches-header">
                <div className="header-info">
                    <h1><Target size={28} /> Job Matches</h1>
                    <p>AI-matched jobs based on your resume skills and experience</p>
                </div>

                <div className="header-controls">
                    <div className="resume-selector">
                        <label>Select Resume:</label>
                        <select
                            value={selectedResume}
                            onChange={(e) => handleResumeChange(e.target.value)}
                            disabled={loading}
                        >
                            {resumes.map((resume) => (
                                <option key={resume.id} value={resume.id}>
                                    {resume.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={handleRefresh}
                        disabled={matching || loading}
                    >
                        {matching ? (
                            <RefreshCw size={18} className="spin" />
                        ) : (
                            <RefreshCw size={18} />
                        )}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Matches Grid */}
            {loading ? (
                <div className="matches-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="match-card loading"></div>
                    ))}
                </div>
            ) : matches.length > 0 ? (
                <>
                    <div className="matches-stats">
                        <div className="stat">
                            <span className="stat-value">{matches.length}</span>
                            <span className="stat-label">Jobs Matched</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">
                                {Math.round(
                                    matches.reduce((acc, m) => acc + (m.overallScore || 0), 0) / matches.length
                                )}%
                            </span>
                            <span className="stat-label">Avg Match Score</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">
                                {matches.filter(m => m.overallScore >= 70).length}
                            </span>
                            <span className="stat-label">Strong Matches</span>
                        </div>
                    </div>

                    <div className="matches-grid">
                        {matches.map((match, index) => (
                            <motion.div
                                key={match.id || index}
                                className="match-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="match-score-badge">
                                    <div className={`score-circle ${getScoreColor(match.overallScore)}`}>
                                        <svg viewBox="0 0 36 36">
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                fill="none"
                                                stroke="var(--border-color)"
                                                strokeWidth="3"
                                            />
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray={`${match.overallScore} 100`}
                                                transform="rotate(-90 18 18)"
                                            />
                                        </svg>
                                        <span className="score-value">{match.overallScore}%</span>
                                    </div>
                                    <span className="match-label">Match</span>
                                </div>

                                <div className="match-content">
                                    <h3 className="job-title">{match.job?.title || 'Job Title'}</h3>
                                    <p className="company-name">{match.job?.company || 'Company'}</p>

                                    <div className="match-meta">
                                        <span>
                                            <MapPin size={14} />
                                            {match.job?.location || 'Remote'}
                                        </span>
                                        <span>
                                            <DollarSign size={14} />
                                            {formatSalary(match.job?.salaryMin, match.job?.salaryMax)}
                                        </span>
                                    </div>

                                    <div className="match-breakdown">
                                        <div className="breakdown-item">
                                            <span>Skills</span>
                                            <div className="mini-progress">
                                                <div
                                                    className="mini-progress-fill"
                                                    style={{ width: `${match.skillMatchScore || 0}%` }}
                                                ></div>
                                            </div>
                                            <span>{match.skillMatchScore || 0}%</span>
                                        </div>
                                        <div className="breakdown-item">
                                            <span>Experience</span>
                                            <div className="mini-progress">
                                                <div
                                                    className="mini-progress-fill"
                                                    style={{ width: `${match.semanticScore || 0}%` }}
                                                ></div>
                                            </div>
                                            <span>{match.semanticScore || 0}%</span>
                                        </div>
                                    </div>

                                    {match.skillGaps && match.skillGaps.length > 0 && (
                                        <div className="skill-gaps">
                                            <span className="gaps-label">Skills to improve:</span>
                                            <div className="gaps-list">
                                                {match.skillGaps.slice(0, 3).map((gap, i) => (
                                                    <span key={i} className="gap-tag">{gap.skill || gap}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="match-actions">
                                    <button
                                        className="btn btn-secondary view-details-btn"
                                        onClick={() => handleViewDetails(match.id)}
                                        disabled={detailLoading}
                                    >
                                        <BrainCircuit size={16} />
                                        AI Analysis
                                    </button>
                                    <Link to={`/candidate/jobs/${match.jobId}`} className="view-job-btn">
                                        View Job
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="matches-empty">
                    <Sparkles size={64} />
                    <h2>No Matches Found</h2>
                    <p>We couldn't find matching jobs for this resume. Try updating your resume or check back later.</p>
                    <Link to="/candidate/jobs" className="btn btn-primary">
                        Browse All Jobs
                    </Link>
                </div>
            )}

            {/* AI Match Detail Modal */}
            {selectedMatch && (
                <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
                    <div className="modal-content match-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <BrainCircuit size={24} style={{ color: 'var(--primary)', marginRight: '10px', verticalAlign: 'middle' }} />
                                AI Match Analysis
                            </h2>
                            <button className="close-button" onClick={() => setSelectedMatch(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-header-card">
                                <h3>{selectedMatch.job?.title}</h3>
                                <p>{selectedMatch.job?.company}</p>

                                <div className="detail-score-row">
                                    <div className="detail-score">
                                        <span className={`score-badge ${getScoreColor(selectedMatch.overallScore)}`}>
                                            {selectedMatch.overallScore}%
                                        </span>
                                        <span>Overall Match</span>
                                    </div>
                                    <div className="detail-score">
                                        <span className="score-badge">
                                            {selectedMatch.skillMatchScore}%
                                        </span>
                                        <span>Skills Match</span>
                                    </div>
                                </div>
                            </div>

                            <div className="analysis-grid">
                                <div className="analysis-card strengths">
                                    <h4><CheckCircle size={18} /> Strong Matches</h4>
                                    <ul>
                                        {selectedMatch.strongMatches?.map((match, i) => (
                                            <li key={i}>{match}</li>
                                        ))}
                                        {(!selectedMatch.strongMatches || selectedMatch.strongMatches.length === 0) && (
                                            <li className="text-muted">No strong exact matches found.</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="analysis-card gaps">
                                    <h4><AlertTriangle size={18} /> Skill Gaps</h4>
                                    <ul>
                                        {selectedMatch.skillGaps?.map((gap, i) => (
                                            <li key={i}>{gap.skill || gap}</li>
                                        ))}
                                        {(!selectedMatch.skillGaps || selectedMatch.skillGaps.length === 0) && (
                                            <li className="text-muted">No major skill gaps identified!</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {selectedMatch.aiExplanation && (
                                <div className="ai-explanation-box">
                                    <h4><Sparkles size={18} fill="currentColor" /> AI Recommendation</h4>
                                    <div className="markdown-content">
                                        <ReactMarkdown>{selectedMatch.aiExplanation}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setSelectedMatch(null)}>
                                    Close
                                </button>
                                <Link to={`/candidate/jobs/${selectedMatch.jobId}`} className="btn btn-primary">
                                    Apply Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Matches;
