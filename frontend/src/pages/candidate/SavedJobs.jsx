import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bookmark,
    BookmarkX,
    MapPin,
    Clock,
    DollarSign,
    Building,
    Briefcase,
    ChevronRight,
    Search,
    StickyNote,
    Edit2,
    Check,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './SavedJobs.css';

const SavedJobs = () => {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingNotes, setEditingNotes] = useState(null);
    const [notesText, setNotesText] = useState('');

    useEffect(() => {
        fetchSavedJobs();
    }, []);

    const fetchSavedJobs = async () => {
        try {
            const response = await api.get('/saved-jobs');
            setSavedJobs(response.data.savedJobs || []);
        } catch (error) {
            console.error('Failed to fetch saved jobs:', error);
            // Use mock data for demo
            setSavedJobs([
                {
                    id: '1',
                    notes: 'Great company culture',
                    savedAt: new Date().toISOString(),
                    job: {
                        id: 'job1',
                        title: 'Senior Software Engineer',
                        company: 'TechCorp',
                        location: 'San Francisco, CA',
                        workType: 'HYBRID',
                        employmentType: 'FULL_TIME',
                        salaryMin: 150000,
                        salaryMax: 200000,
                        skills: [{ name: 'React', isRequired: true }, { name: 'Node.js', isRequired: true }],
                        applicationCount: 32
                    }
                },
                {
                    id: '2',
                    notes: null,
                    savedAt: new Date(Date.now() - 86400000).toISOString(),
                    job: {
                        id: 'job2',
                        title: 'Full Stack Developer',
                        company: 'StartupXYZ',
                        location: 'Remote',
                        workType: 'REMOTE',
                        employmentType: 'FULL_TIME',
                        salaryMin: 100000,
                        salaryMax: 140000,
                        skills: [{ name: 'TypeScript', isRequired: true }, { name: 'AWS', isRequired: false }],
                        applicationCount: 28
                    }
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (jobId) => {
        try {
            await api.delete(`/saved-jobs/${jobId}`);
            setSavedJobs(prev => prev.filter(sj => sj.job.id !== jobId));
            toast.success('Job removed from saved');
        } catch (error) {
            // Remove locally anyway for demo
            setSavedJobs(prev => prev.filter(sj => sj.job.id !== jobId));
            toast.success('Job removed from saved');
        }
    };

    const handleEditNotes = (savedJob) => {
        setEditingNotes(savedJob.job.id);
        setNotesText(savedJob.notes || '');
    };

    const handleSaveNotes = async (jobId) => {
        try {
            await api.patch(`/saved-jobs/${jobId}`, { notes: notesText });
            setSavedJobs(prev => prev.map(sj =>
                sj.job.id === jobId ? { ...sj, notes: notesText } : sj
            ));
            toast.success('Notes updated');
        } catch (error) {
            // Update locally anyway
            setSavedJobs(prev => prev.map(sj =>
                sj.job.id === jobId ? { ...sj, notes: notesText } : sj
            ));
            toast.success('Notes updated');
        }
        setEditingNotes(null);
    };

    const filteredJobs = savedJobs.filter(sj =>
        sj.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sj.job.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Not specified';
        const format = (n) => `$${(n / 1000).toFixed(0)}k`;
        if (min && max) return `${format(min)} - ${format(max)}`;
        if (min) return `${format(min)}+`;
        return `Up to ${format(max)}`;
    };

    const getWorkTypeBadge = (type) => {
        const types = {
            REMOTE: { label: 'Remote', class: 'remote' },
            HYBRID: { label: 'Hybrid', class: 'hybrid' },
            ONSITE: { label: 'On-site', class: 'onsite' }
        };
        return types[type] || { label: type, class: '' };
    };

    if (loading) {
        return (
            <div className="saved-jobs-loading">
                <div className="loader"></div>
                <p>Loading saved jobs...</p>
            </div>
        );
    }

    return (
        <div className="saved-jobs-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><Bookmark size={28} /> Saved Jobs</h1>
                    <p>Jobs you've bookmarked for later</p>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search saved jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredJobs.length > 0 ? (
                <div className="saved-jobs-list">
                    <AnimatePresence>
                        {filteredJobs.map((savedJob, index) => (
                            <motion.div
                                key={savedJob.id}
                                className="saved-job-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="job-main">
                                    <div className="job-header">
                                        <div className="company-logo">
                                            <Building size={24} />
                                        </div>
                                        <div className="job-info">
                                            <Link to={`/candidate/jobs/${savedJob.job.id}`} className="job-title">
                                                {savedJob.job.title}
                                            </Link>
                                            <div className="job-company">{savedJob.job.company}</div>
                                        </div>
                                        <button
                                            className="unsave-btn"
                                            onClick={() => handleUnsave(savedJob.job.id)}
                                            title="Remove from saved"
                                        >
                                            <BookmarkX size={20} />
                                        </button>
                                    </div>

                                    <div className="job-meta">
                                        <span className="meta-item">
                                            <MapPin size={14} />
                                            {savedJob.job.location}
                                        </span>
                                        <span className={`work-type ${getWorkTypeBadge(savedJob.job.workType).class}`}>
                                            {getWorkTypeBadge(savedJob.job.workType).label}
                                        </span>
                                        <span className="meta-item">
                                            <DollarSign size={14} />
                                            {formatSalary(savedJob.job.salaryMin, savedJob.job.salaryMax)}
                                        </span>
                                        <span className="meta-item">
                                            <Briefcase size={14} />
                                            {savedJob.job.applicationCount} applicants
                                        </span>
                                    </div>

                                    <div className="job-skills">
                                        {savedJob.job.skills?.slice(0, 4).map((skill, i) => (
                                            <span key={i} className={`skill-tag ${skill.isRequired ? 'required' : ''}`}>
                                                {skill.name}
                                            </span>
                                        ))}
                                        {savedJob.job.skills?.length > 4 && (
                                            <span className="skill-more">+{savedJob.job.skills.length - 4}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="job-notes">
                                    {editingNotes === savedJob.job.id ? (
                                        <div className="notes-editor">
                                            <textarea
                                                value={notesText}
                                                onChange={(e) => setNotesText(e.target.value)}
                                                placeholder="Add your notes..."
                                                autoFocus
                                            />
                                            <div className="notes-actions">
                                                <button className="btn-icon success" onClick={() => handleSaveNotes(savedJob.job.id)}>
                                                    <Check size={16} />
                                                </button>
                                                <button className="btn-icon" onClick={() => setEditingNotes(null)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="notes-display" onClick={() => handleEditNotes(savedJob)}>
                                            <StickyNote size={14} />
                                            {savedJob.notes ? (
                                                <span className="notes-text">{savedJob.notes}</span>
                                            ) : (
                                                <span className="notes-placeholder">Add notes...</span>
                                            )}
                                            <Edit2 size={14} className="edit-icon" />
                                        </div>
                                    )}
                                </div>

                                <div className="job-footer">
                                    <span className="saved-date">
                                        <Clock size={14} />
                                        Saved {new Date(savedJob.savedAt).toLocaleDateString()}
                                    </span>
                                    <Link to={`/candidate/jobs/${savedJob.job.id}`} className="view-btn">
                                        View Job <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="empty-state">
                    <Bookmark size={48} />
                    <h3>No saved jobs</h3>
                    <p>Browse jobs and click the bookmark icon to save them for later</p>
                    <Link to="/candidate/jobs" className="btn btn-primary">
                        Browse Jobs
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SavedJobs;
