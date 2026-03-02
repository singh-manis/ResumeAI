import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    DollarSign,
    Plus,
    X,
    Save,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI } from '../../services/api';
import api from '../../services/api';
import './JobForm.css';

const workTypes = [
    { value: 'REMOTE', label: 'Remote' },
    { value: 'HYBRID', label: 'Hybrid' },
    { value: 'ONSITE', label: 'On-site' }
];

const employmentTypes = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERNSHIP', label: 'Internship' }
];

const experienceLevels = [
    { value: 'ENTRY', label: 'Entry Level (0-2 years)' },
    { value: 'MID', label: 'Mid Level (2-5 years)' },
    { value: 'SENIOR', label: 'Senior Level (5-10 years)' },
    { value: 'LEAD', label: 'Lead/Principal (10+ years)' }
];

const JobForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [availableSkills, setAvailableSkills] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        workType: 'REMOTE',
        employmentType: 'FULL_TIME',
        experienceLevel: 'MID',
        salaryMin: '',
        salaryMax: '',
        deadline: ''
    });

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            const response = await api.get('/jobs/skills');
            setAvailableSkills(response.data.skills || []);
        } catch (error) {
            console.error('Failed to load skills:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSkill = (skillName, isRequired = false) => {
        if (!skillName.trim()) return;

        const existingSkill = skills.find(s =>
            s.name.toLowerCase() === skillName.toLowerCase()
        );

        if (existingSkill) {
            toast.error('Skill already added');
            return;
        }

        setSkills(prev => [...prev, { name: skillName.trim(), isRequired }]);
        setSkillInput('');
    };

    const removeSkill = (index) => {
        setSkills(prev => prev.filter((_, i) => i !== index));
    };

    const toggleSkillRequired = (index) => {
        setSkills(prev => prev.map((skill, i) =>
            i === index ? { ...skill, isRequired: !skill.isRequired } : skill
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.company || !formData.description) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const jobData = {
                ...formData,
                salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
                // Send skills as plain string names (backend expects strings for findUnique)
                // Also send isRequired as a separate lookup map
                skills: skills.map(s => s.name),
                skillsRequired: Object.fromEntries(
                    skills.map(s => [s.name.toLowerCase(), s.isRequired])
                ),
            };

            await jobAPI.create(jobData);
            toast.success('Job posted successfully!');
            navigate('/recruiter/jobs');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="job-form-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
                Back
            </button>

            <motion.div
                className="form-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="form-header">
                    <div className="form-icon">
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <h1>Post a New Job</h1>
                        <p>Create a job listing to attract top talent</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Basic Info Section */}
                    <div className="form-section">
                        <h2>Basic Information</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="title">Job Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Senior Software Engineer"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="company">Company Name *</label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="e.g., TechCorp Inc."
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Job Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                                rows={6}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="requirements">Requirements</label>
                            <textarea
                                id="requirements"
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                placeholder="List the qualifications, experience, and skills required (comma-separated)"
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Location & Type Section */}
                    <div className="form-section">
                        <h2>Location & Work Type</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="location">
                                    <MapPin size={16} />
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., San Francisco, CA or Remote"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="workType">Work Type</label>
                                <select
                                    id="workType"
                                    name="workType"
                                    value={formData.workType}
                                    onChange={handleChange}
                                >
                                    {workTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="employmentType">Employment Type</label>
                                <select
                                    id="employmentType"
                                    name="employmentType"
                                    value={formData.employmentType}
                                    onChange={handleChange}
                                >
                                    {employmentTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="experienceLevel">Experience Level</label>
                                <select
                                    id="experienceLevel"
                                    name="experienceLevel"
                                    value={formData.experienceLevel}
                                    onChange={handleChange}
                                >
                                    {experienceLevels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Compensation Section */}
                    <div className="form-section">
                        <h2>
                            <DollarSign size={18} />
                            Compensation
                        </h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="salaryMin">Minimum Salary (USD/year)</label>
                                <input
                                    type="number"
                                    id="salaryMin"
                                    name="salaryMin"
                                    value={formData.salaryMin}
                                    onChange={handleChange}
                                    placeholder="e.g., 80000"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="salaryMax">Maximum Salary (USD/year)</label>
                                <input
                                    type="number"
                                    id="salaryMax"
                                    name="salaryMax"
                                    value={formData.salaryMax}
                                    onChange={handleChange}
                                    placeholder="e.g., 120000"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="deadline">Application Deadline</label>
                            <input
                                type="date"
                                id="deadline"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="form-section">
                        <h2>Required Skills</h2>
                        <p className="section-hint">Add skills that candidates should have</p>

                        <div className="skill-input-row">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                placeholder="Type a skill..."
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addSkill(skillInput, true);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="add-skill-btn"
                                onClick={() => addSkill(skillInput, true)}
                            >
                                <Plus size={18} />
                                Add
                            </button>
                        </div>

                        {availableSkills.length > 0 && (
                            <div className="suggested-skills">
                                <span>Suggested:</span>
                                {availableSkills.slice(0, 10).map(skill => (
                                    <button
                                        key={skill.id}
                                        type="button"
                                        className="suggested-skill"
                                        onClick={() => addSkill(skill.name)}
                                    >
                                        {skill.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {skills.length > 0 && (
                            <div className="selected-skills">
                                {skills.map((skill, index) => (
                                    <div
                                        key={index}
                                        className={`skill-tag ${skill.isRequired ? 'required' : ''}`}
                                    >
                                        <span>{skill.name}</span>
                                        <button
                                            type="button"
                                            className="toggle-required"
                                            onClick={() => toggleSkillRequired(index)}
                                            title={skill.isRequired ? 'Mark as optional' : 'Mark as required'}
                                        >
                                            {skill.isRequired ? '★' : '☆'}
                                        </button>
                                        <button
                                            type="button"
                                            className="remove-skill"
                                            onClick={() => removeSkill(index)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Post Job
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default JobForm;
