import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    MapPin,
    BriefcaseBusiness,
    DollarSign,
    Clock,
    Building2,
    Filter,
    X,
    ChevronDown,
    Bookmark,
    UsersRound,
    TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI } from '../../services/api';
import './Jobs.css';

const Jobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        location: '',
        workType: '',
        employmentType: '',
        salaryMin: '',
        salaryMax: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    useEffect(() => {
        loadJobs();
    }, [pagination.page]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            };
            const response = await jobAPI.getAll(params);
            setJobs(response.data.jobs);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total,
                pages: response.data.pagination.pages
            }));
        } catch (error) {
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadJobs();
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            location: '',
            workType: '',
            employmentType: '',
            salaryMin: '',
            salaryMax: ''
        });
    };

    const formatSalary = (min, max) => {
        if (!min && !max) return 'Salary not disclosed';
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        });
        if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
        if (min) return `From ${formatter.format(min)}`;
        return `Up to ${formatter.format(max)}`;
    };

    const getWorkTypeBadge = (type) => {
        const badges = {
            REMOTE: { class: 'remote', label: 'Remote' },
            HYBRID: { class: 'hybrid', label: 'Hybrid' },
            ONSITE: { class: 'onsite', label: 'On-site' }
        };
        return badges[type] || { class: '', label: type };
    };

    return (
        <div className="jobs-page">
            {/* Search Header */}
            <div className="jobs-header">
                <div className="header-content">
                    <h1>Find Your Dream Job</h1>
                    <p>Discover opportunities that match your skills and experience</p>
                </div>

                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-bar">
                        <div className="search-input-group">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Job title, skills, or company"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <div className="search-input-group location">
                            <MapPin size={20} />
                            <input
                                type="text"
                                placeholder="Location"
                                value={filters.location}
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                            />
                        </div>
                        <button type="submit" className="search-btn">
                            <Search size={18} />
                            Search
                        </button>
                    </div>

                    <button
                        type="button"
                        className="filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={18} />
                        Filters
                        <ChevronDown size={16} className={showFilters ? 'rotate' : ''} />
                    </button>
                </form>

                {/* Expanded Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            className="filters-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <div className="filters-grid">
                                <div className="filter-group">
                                    <label>Work Type</label>
                                    <select
                                        value={filters.workType}
                                        onChange={(e) => handleFilterChange('workType', e.target.value)}
                                    >
                                        <option value="">Any</option>
                                        <option value="REMOTE">Remote</option>
                                        <option value="HYBRID">Hybrid</option>
                                        <option value="ONSITE">On-site</option>
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>Employment Type</label>
                                    <select
                                        value={filters.employmentType}
                                        onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                                    >
                                        <option value="">Any</option>
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="INTERNSHIP">Internship</option>
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>Min Salary</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 50000"
                                        value={filters.salaryMin}
                                        onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                                    />
                                </div>

                                <div className="filter-group">
                                    <label>Max Salary</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 150000"
                                        value={filters.salaryMax}
                                        onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="filters-actions">
                                <button type="button" className="clear-btn" onClick={clearFilters}>
                                    <X size={16} />
                                    Clear All
                                </button>
                                <button type="button" className="apply-btn" onClick={handleSearch}>
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results */}
            <div className="jobs-content">
                <div className="results-header">
                    <span className="results-count">
                        {pagination.total} jobs found
                    </span>
                </div>

                {loading ? (
                    <div className="jobs-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="job-card loading"></div>
                        ))}
                    </div>
                ) : jobs.length > 0 ? (
                    <>
                        <div className="jobs-grid">
                            {jobs.map((job, index) => (
                                <motion.div
                                    key={job.id}
                                    className="job-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="job-card-header">
                                        <div className="company-logo">
                                            <Building2 size={24} />
                                        </div>
                                        <button className="bookmark-btn">
                                            <Bookmark size={18} />
                                        </button>
                                    </div>

                                    <div className="job-card-body">
                                        <h3 className="job-title">{job.title}</h3>
                                        <p className="company-name">{job.company}</p>

                                        <div className="job-meta">
                                            <span className="meta-item">
                                                <MapPin size={14} />
                                                {job.location || 'Location not specified'}
                                            </span>
                                            <span className="meta-item">
                                                <DollarSign size={14} />
                                                {formatSalary(job.salaryMin, job.salaryMax)}
                                            </span>
                                        </div>

                                        <div className="job-badges">
                                            <span className={`badge work-type ${getWorkTypeBadge(job.workType).class}`}>
                                                {getWorkTypeBadge(job.workType).label}
                                            </span>
                                            <span className="badge employment-type">
                                                {job.employmentType?.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {job.skills && job.skills.length > 0 && (
                                            <div className="job-skills">
                                                {job.skills.slice(0, 4).map((skill, i) => (
                                                    <span key={i} className="skill-tag">
                                                        {skill.skill?.name || skill.name}
                                                    </span>
                                                ))}
                                                {job.skills.length > 4 && (
                                                    <span className="skill-tag more">+{job.skills.length - 4}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="job-card-footer">
                                        <div className="job-stats">
                                            <span><UsersRound size={14} /> {job.applicationCount || 0} applicants</span>
                                            <span><Clock size={14} /> {getTimeAgo(job.createdAt)}</span>
                                        </div>
                                        <Link to={`/candidate/jobs/${job.id}`} className="apply-link">
                                            View Details
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </button>
                                <span>Page {pagination.page} of {pagination.pages}</span>
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page === pagination.pages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <BriefcaseBusiness size={64} />
                        <h2>No jobs found</h2>
                        <p>Try adjusting your filters or search terms</p>
                        <button onClick={clearFilters} className="btn btn-primary">
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

export default Jobs;
