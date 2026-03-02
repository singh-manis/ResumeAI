import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Users,
    Search,
    Filter,
    Star,
    Mail,
    Phone,
    MapPin,
    FileText,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
    TrendingUp,
    X,
    Cpu,
    KanbanSquare,
    LayoutGrid
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './Candidates.css';

// The valid statuses in order of pipeline
const PIPELINE_COLUMNS = [
    { id: 'PENDING', title: 'Pending', icon: <Clock size={16} /> },
    { id: 'REVIEWED', title: 'Reviewing', icon: <Eye size={16} /> },
    { id: 'SHORTLISTED', title: 'Shortlisted', icon: <Star size={16} /> },
    { id: 'INTERVIEW', title: 'Interview', icon: <Phone size={16} /> },
    { id: 'OFFERED', title: 'Offered', icon: <FileText size={16} /> },
    { id: 'REJECTED', title: 'Rejected', icon: <XCircle size={16} /> }
];

const Candidates = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board'); // 'board' or 'grid'
    const [filters, setFilters] = useState({
        status: '',
        jobId: '',
        search: ''
    });
    const [jobs, setJobs] = useState([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);

    useEffect(() => {
        loadJobs();
        loadApplications();
    }, []);

    const loadJobs = async () => {
        try {
            const response = await api.get('/jobs/my-jobs');
            setJobs(response.data.jobs || []);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        }
    };

    const loadApplications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/jobs/applications');
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Failed to load applications:', error);
            // Fallback mock data
            setApplications([
                {
                    id: '1',
                    status: 'PENDING',
                    createdAt: new Date().toISOString(),
                    candidate: { id: 'c1', firstName: 'John', lastName: 'Developer', email: 'john@example.com' },
                    resume: { id: 'r1', title: 'Software Developer Resume', atsScore: 85 },
                    job: { id: 'j1', title: 'Senior Software Engineer', company: 'TechCorp' },
                    matchScore: 82
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const updateApplicationStatus = async (applicationId, newStatus) => {
        if (!newStatus) return;

        // Optimistic UI update
        const previousApps = [...applications];
        setApplications(prev =>
            prev.map(app =>
                app.id === applicationId ? { ...app, status: newStatus } : app
            )
        );

        try {
            await api.patch(`/jobs/applications/${applicationId}`, { status: newStatus });
            toast.success(`Moved to ${newStatus.charAt(0) + newStatus.slice(1).toLowerCase()}`);
        } catch (error) {
            console.error('Failed to update status', error);
            // Rollback on failure
            setApplications(previousApps);
            toast.error('Failed to move candidate');
        }
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        // Dropped outside the list
        if (!destination) return;

        // Dropped in the same spot
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // The droppableId is the new status
        const newStatus = destination.droppableId;
        const oldStatus = source.droppableId;

        if (newStatus !== oldStatus) {
            updateApplicationStatus(draggableId, newStatus);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            PENDING: { class: 'pending', icon: <Clock size={14} />, label: 'Pending' },
            REVIEWED: { class: 'reviewed', icon: <Eye size={14} />, label: 'Reviewing' },
            SHORTLISTED: { class: 'shortlisted', icon: <Star size={14} />, label: 'Short' },
            INTERVIEW: { class: 'reviewed', icon: <Phone size={14} />, label: 'Inter' },
            OFFERED: { class: 'hired', icon: <CheckCircle size={14} />, label: 'Offered' },
            REJECTED: { class: 'rejected', icon: <XCircle size={14} />, label: 'Rejected' },
            HIRED: { class: 'hired', icon: <CheckCircle size={14} />, label: 'Hired' }
        };
        return badges[status] || badges.PENDING;
    };

    const filteredApplications = applications.filter(app => {
        if (filters.status && app.status !== filters.status) return false;
        if (filters.jobId && app.job?.id !== filters.jobId) return false;
        if (filters.search) {
            const search = filters.search.toLowerCase();
            const fullName = `${app.candidate?.firstName} ${app.candidate?.lastName}`.toLowerCase();
            return fullName.includes(search) || app.candidate?.email?.toLowerCase().includes(search);
        }
        return true;
    });

    // Render individual Candidate Card UI
    const renderCandidateCard = (app, isBoard = false) => (
        <div className={`candidate-card ${isBoard ? 'board-card' : ''}`}>
            <div className="card-header">
                <div className="candidate-avatar">
                    {app.candidate?.firstName?.[0]}{app.candidate?.lastName?.[0]}
                </div>
                {!isBoard && (
                    <div className={`status-badge ${getStatusBadge(app.status).class}`}>
                        {getStatusBadge(app.status).icon}
                        {getStatusBadge(app.status).label}
                    </div>
                )}
            </div>

            <div className="candidate-info">
                <h3>{app.candidate?.firstName} {app.candidate?.lastName}</h3>
                <p className="applied-for">
                    Applied for: <strong>{app.job?.title || 'Unknown Role'}</strong>
                </p>

                <div className="contact-info">
                    <span><Mail size={14} /> {app.candidate?.email}</span>
                </div>
            </div>

            <div className="scores-row">
                <div className="score-item" style={{ color: app.matchScore >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                    <Cpu size={14} />
                    <span>AI Match: <strong>{app.matchScore ? `${app.matchScore}%` : 'Pending'}</strong></span>
                </div>
                {!isBoard && (
                    <div className="score-item">
                        <FileText size={14} />
                        <span>ATS: <strong>{app.resume?.atsScore ? `${app.resume.atsScore}%` : 'N/A'}</strong></span>
                    </div>
                )}
            </div>

            <div className="card-actions">
                {app.matchAnalysis && (
                    <button
                        className="action-btn"
                        style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}
                        onClick={() => setSelectedAnalysis(app.matchAnalysis)}
                        title="View AI Analysis"
                    >
                        <Star size={16} fill="currentColor" />
                        {!isBoard && ' Analysis'}
                    </button>
                )}
                <button
                    className="action-btn view"
                    onClick={() => {
                        if (app.resume?.fileUrl) {
                            const backendUrl = import.meta.env.VITE_API_URL.replace('/api', '');
                            const fileUrl = app.resume.fileUrl.startsWith('/') ? app.resume.fileUrl : `/${app.resume.fileUrl}`;
                            window.open(`${backendUrl}${fileUrl}`, '_blank');
                        } else {
                            toast.error('Resume file not found');
                        }
                    }}
                    title="View Resume"
                >
                    <Eye size={16} />
                    {!isBoard && ' View'}
                </button>
                <button
                    className="action-btn"
                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}
                    onClick={() => {
                        navigate('/recruiter/messages', {
                            state: {
                                startChat: true,
                                otherUserId: app.candidate.id,
                                jobId: app.job.id
                            }
                        });
                    }}
                    title="Message Candidate"
                >
                    <MessageSquare size={16} />
                    {!isBoard && ' Message'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="candidates-page">
            <div className="page-header">
                <div>
                    <h1><Users size={28} /> Pipeline</h1>
                    <p>Drag and drop candidates to update their tracking status</p>
                </div>

                {/* View Mode Toggle */}
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
                        onClick={() => setViewMode('board')}
                    >
                        <KanbanSquare size={18} /> Board
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid size={18} /> Grid
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search candidates by name or email..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                {viewMode === 'grid' && (
                    <div className="filter-group">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            {PIPELINE_COLUMNS.map(col => (
                                <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="filter-group">
                    <select
                        value={filters.jobId}
                        onChange={(e) => setFilters(prev => ({ ...prev, jobId: e.target.value }))}
                    >
                        <option value="">All Jobs</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="candidate-card loading" />
                    ))}
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="empty-state">
                    <Users size={64} />
                    <h2>No Applications Found</h2>
                    <p>No applications match your current filters.</p>
                </div>
            ) : (
                <>
                    {/* BOARD VIEW */}
                    {viewMode === 'board' && (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className="kanban-board">
                                {PIPELINE_COLUMNS.map((column) => {
                                    // Get apps matching this column
                                    const columnApps = filteredApplications.filter(app => app.status === column.id);

                                    return (
                                        <div key={column.id} className="kanban-column">
                                            <div className="kanban-column-header">
                                                <div className="kanban-header-left">
                                                    {column.icon}
                                                    <h3>{column.title}</h3>
                                                </div>
                                                <span className="kanban-count">{columnApps.length}</span>
                                            </div>

                                            <Droppable droppableId={column.id}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`kanban-dropzone ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                                    >
                                                        {columnApps.map((app, index) => (
                                                            <Draggable key={app.id} draggableId={app.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={`kanban-draggable ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                                                        style={{ ...provided.draggableProps.style }}
                                                                    >
                                                                        {renderCandidateCard(app, true)}
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    );
                                })}
                            </div>
                        </DragDropContext>
                    )}

                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <div className="candidates-grid">
                            {filteredApplications.map((app, index) => (
                                <motion.div
                                    key={app.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    {renderCandidateCard(app, false)}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* AI Analysis Modal */}
            <AnimatePresence>
                {selectedAnalysis && (
                    <motion.div
                        className="modal-overlay"
                        onClick={() => setSelectedAnalysis(null)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-content"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '600px', width: '90%' }}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h2><Cpu size={24} style={{ color: 'var(--primary)', marginRight: '10px', verticalAlign: 'middle' }} /> AI Match Analysis</h2>
                                <button className="close-button" onClick={() => setSelectedAnalysis(null)}><X size={24} /></button>
                            </div>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
                                <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-card-hover)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: selectedAnalysis.matchScore >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                                        {selectedAnalysis.matchScore}%
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Overall Match Score</p>
                                </div>

                                <div>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '10px' }}>
                                        <CheckCircle size={18} /> Detected Strengths
                                    </h4>
                                    <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                                        {selectedAnalysis.strengths?.map((s, i) => <li key={i} style={{ marginBottom: '5px' }}>{s}</li>) || <li>No clear strengths identified.</li>}
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', marginBottom: '10px' }}>
                                        <XCircle size={18} /> Missing Requirements (Gaps)
                                    </h4>
                                    <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                                        {selectedAnalysis.gaps?.map((g, i) => <li key={i} style={{ marginBottom: '5px' }}>{g}</li>) || <li>No major gaps identified.</li>}
                                    </ul>
                                </div>

                                <div style={{ padding: '15px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginTop: 0, marginBottom: '8px' }}>
                                        <Star size={18} fill="currentColor" /> AI Feedback
                                    </h4>
                                    <p style={{ margin: 0, lineHeight: '1.5', color: 'var(--text-secondary)' }}>{selectedAnalysis.candidateFeedback}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Candidates;
