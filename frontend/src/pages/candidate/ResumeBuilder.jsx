import React, { useState, useRef } from 'react';
import {
    FileText, Download, Eye, Edit3, Plus, Trash2,
    User, Briefcase, GraduationCap, Award, Code,
    Mail, Phone, MapPin, Globe, Linkedin, Github,
    ChevronDown, ChevronUp, Grip, Save, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './ResumeBuilder.css';
import { aiAPI } from '../../services/api';

const ResumeBuilder = () => {
    const [activeSection, setActiveSection] = useState('personal');
    const [previewMode, setPreviewMode] = useState(false);
    const previewRef = useRef(null);

    const [resumeData, setResumeData] = useState({
        personal: {
            firstName: '',
            lastName: '',
            title: '',
            email: '',
            phone: '',
            location: '',
            website: '',
            linkedin: '',
            github: '',
            summary: ''
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: []
    });

    const [selectedTemplate, setSelectedTemplate] = useState('modern');

    // CLEANSING: Remove corrupted data from previous session if found
    React.useEffect(() => {
        const saved = localStorage.getItem('resumeBuilder_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                let textToClean = "Load Saved Save Preview";
                let cleaned = false;

                // Check and clean specific fields known to be corrupted
                if (parsed.personal && parsed.personal.website && parsed.personal.website.includes("Load Saved")) {
                    parsed.personal.website = "";
                    cleaned = true;
                }
                if (parsed.personal && parsed.personal.summary && parsed.personal.summary.includes("Load Saved")) {
                    parsed.personal.summary = "";
                    cleaned = true;
                }

                if (cleaned) {
                    setResumeData(parsed);
                    localStorage.setItem('resumeBuilder_data', JSON.stringify(parsed));
                    toast.success('Fixed corrupted data from previous session');
                }
            } catch (e) {
                console.error("Error cleaning data", e);
            }
        }
    }, []);

    const templates = [
        { id: 'modern', name: 'Modern', color: '#6366f1' },
        { id: 'minimal', name: 'Minimal', color: '#10b981' },
        { id: 'professional', name: 'Professional', color: '#3b82f6' },
        { id: 'creative', name: 'Creative', color: '#8b5cf6' }
    ];

    const sections = [
        { id: 'personal', name: 'Personal Info', icon: User },
        { id: 'experience', name: 'Experience', icon: Briefcase },
        { id: 'education', name: 'Education', icon: GraduationCap },
        { id: 'skills', name: 'Skills', icon: Code },
        { id: 'projects', name: 'Projects', icon: Award },
        { id: 'certifications', name: 'Certifications', icon: Award }
    ];

    const updatePersonal = (field, value) => {
        setResumeData(prev => ({
            ...prev,
            personal: { ...prev.personal, [field]: value }
        }));
    };

    const addItem = (section) => {
        const newItem = getEmptyItem(section);
        setResumeData(prev => ({
            ...prev,
            [section]: [...prev[section], newItem]
        }));
    };

    const updateItem = (section, index, field, value) => {
        setResumeData(prev => ({
            ...prev,
            [section]: prev[section].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const removeItem = (section, index) => {
        setResumeData(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    const getEmptyItem = (section) => {
        switch (section) {
            case 'experience':
                return { company: '', title: '', location: '', startDate: '', endDate: '', current: false, description: '' };
            case 'education':
                return { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };
            case 'skills':
                return { name: '', level: 3 };
            case 'projects':
                return { name: '', description: '', technologies: '', link: '' };
            case 'certifications':
                return { name: '', issuer: '', date: '', link: '' };
            default:
                return {};
        }
    };

    const handleExportPDF = async () => {
        toast.loading('Generating PDF...');

        // Use browser print functionality for now
        // In production, you would call a backend PDF generation endpoint
        setTimeout(() => {
            toast.dismiss();
            window.print();
            toast.success('Ready to save as PDF!');
        }, 1000);
    };

    const handleAISuggest = async () => {
        if (!resumeData.personal.summary && activeSection === 'personal') {
            toast.error('Please add some details first');
            return;
        }

        const toastId = toast.loading('Getting AI suggestions...');
        try {
            let textToEnhance = '';
            let type = '';

            if (activeSection === 'personal') {
                if (resumeData.personal.summary) {
                    textToEnhance = resumeData.personal.summary;
                    type = 'summary';
                } else {
                    // Generate new summary from profile details
                    textToEnhance = JSON.stringify({
                        role: resumeData.personal.title,
                        skills: resumeData.skills.map(s => s.name),
                        experience: resumeData.experience.map(e => `${e.title} at ${e.company}`)
                    });
                    type = 'generate_summary';
                }
            } else if (activeSection === 'experience' && resumeData.experience.length > 0) {
                textToEnhance = resumeData.experience[0].description || `Role: ${resumeData.experience[0].title} at ${resumeData.experience[0].company}`;
                type = 'experience';
            }

            if (!textToEnhance && type !== 'generate_summary') {
                toast.error('Please add some details first', { id: toastId });
                return;
            }

            const response = await aiAPI.enhance(textToEnhance, type);

            if (activeSection === 'personal') {
                updatePersonal('summary', response.data.enhancedText);
            } else if (activeSection === 'experience') {
                updateItem('experience', 0, 'description', response.data.enhancedText);
            }

            toast.success('Suggestions applied!', { id: toastId });
        } catch (error) {
            console.error('AI Suggest error:', error);
            toast.error('Failed to get suggestions', { id: toastId });
        }
    };

    const handleSaveResume = () => {
        localStorage.setItem('resumeBuilder_data', JSON.stringify(resumeData));
        toast.success('Resume saved locally!');
    };

    const handleLoadResume = () => {
        const saved = localStorage.getItem('resumeBuilder_data');
        if (saved) {
            setResumeData(JSON.parse(saved));
            toast.success('Resume loaded!');
        } else {
            toast.error('No saved resume found');
        }
    };

    const renderPersonalForm = () => (
        <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        value={resumeData.personal.firstName}
                        onChange={(e) => updatePersonal('firstName', e.target.value)}
                        placeholder="John"
                    />
                </div>
                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={resumeData.personal.lastName}
                        onChange={(e) => updatePersonal('lastName', e.target.value)}
                        placeholder="Doe"
                    />
                </div>
                <div className="form-group full-width">
                    <label>Professional Title</label>
                    <input
                        type="text"
                        value={resumeData.personal.title}
                        onChange={(e) => updatePersonal('title', e.target.value)}
                        placeholder="Full Stack Developer"
                    />
                </div>
            </div>

            <h3>Contact Information</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label><Mail size={14} /> Email</label>
                    <input
                        type="email"
                        value={resumeData.personal.email}
                        onChange={(e) => updatePersonal('email', e.target.value)}
                        placeholder="john@example.com"
                    />
                </div>
                <div className="form-group">
                    <label><Phone size={14} /> Phone</label>
                    <input
                        type="tel"
                        value={resumeData.personal.phone}
                        onChange={(e) => updatePersonal('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                    />
                </div>
                <div className="form-group">
                    <label><MapPin size={14} /> Location</label>
                    <input
                        type="text"
                        value={resumeData.personal.location}
                        onChange={(e) => updatePersonal('location', e.target.value)}
                        placeholder="New York, NY"
                    />
                </div>
                <div className="form-group">
                    <label><Globe size={14} /> Website</label>
                    <input
                        type="url"
                        value={resumeData.personal.website}
                        onChange={(e) => updatePersonal('website', e.target.value)}
                        placeholder="https://johndoe.com"
                    />
                </div>
                <div className="form-group">
                    <label><Linkedin size={14} /> LinkedIn</label>
                    <input
                        type="text"
                        value={resumeData.personal.linkedin}
                        onChange={(e) => updatePersonal('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/johndoe"
                    />
                </div>
                <div className="form-group">
                    <label><Github size={14} /> GitHub</label>
                    <input
                        type="text"
                        value={resumeData.personal.github}
                        onChange={(e) => updatePersonal('github', e.target.value)}
                        placeholder="github.com/johndoe"
                    />
                </div>
            </div>

            <h3>Professional Summary</h3>
            <div className="form-group full-width">
                <textarea
                    value={resumeData.personal.summary}
                    onChange={(e) => updatePersonal('summary', e.target.value)}
                    placeholder="A brief summary of your professional background and career goals..."
                    rows={4}
                />
            </div>
        </div>
    );

    const renderExperienceForm = () => (
        <div className="form-section">
            <div className="section-header">
                <h3>Work Experience</h3>
                <button className="add-btn" onClick={() => addItem('experience')}>
                    <Plus size={16} /> Add Experience
                </button>
            </div>

            {resumeData.experience.map((exp, index) => (
                <motion.div
                    key={index}
                    className="item-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="item-header">
                        <Grip size={16} className="drag-handle" />
                        <span className="item-number">#{index + 1}</span>
                        <button className="remove-btn" onClick={() => removeItem('experience', index)}>
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Company</label>
                            <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateItem('experience', index, 'company', e.target.value)}
                                placeholder="Google"
                            />
                        </div>
                        <div className="form-group">
                            <label>Job Title</label>
                            <input
                                type="text"
                                value={exp.title}
                                onChange={(e) => updateItem('experience', index, 'title', e.target.value)}
                                placeholder="Senior Software Engineer"
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                value={exp.location}
                                onChange={(e) => updateItem('experience', index, 'location', e.target.value)}
                                placeholder="Mountain View, CA"
                            />
                        </div>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => updateItem('experience', index, 'startDate', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) => updateItem('experience', index, 'endDate', e.target.value)}
                                disabled={exp.current}
                            />
                        </div>
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exp.current}
                                    onChange={(e) => updateItem('experience', index, 'current', e.target.checked)}
                                />
                                Currently working here
                            </label>
                        </div>
                    </div>
                    <div className="form-group full-width">
                        <label>Description</label>
                        <textarea
                            value={exp.description}
                            onChange={(e) => updateItem('experience', index, 'description', e.target.value)}
                            placeholder="• Describe your responsibilities and achievements&#10;• Use bullet points for clarity&#10;• Quantify results when possible"
                            rows={4}
                        />
                    </div>
                </motion.div>
            ))}

            {resumeData.experience.length === 0 && (
                <div className="empty-state">
                    <Briefcase size={48} />
                    <p>No work experience added yet</p>
                    <button className="add-btn" onClick={() => addItem('experience')}>
                        <Plus size={16} /> Add Your First Experience
                    </button>
                </div>
            )}
        </div>
    );

    const renderEducationForm = () => (
        <div className="form-section">
            <div className="section-header">
                <h3>Education</h3>
                <button className="add-btn" onClick={() => addItem('education')}>
                    <Plus size={16} /> Add Education
                </button>
            </div>

            {resumeData.education.map((edu, index) => (
                <motion.div
                    key={index}
                    className="item-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="item-header">
                        <Grip size={16} className="drag-handle" />
                        <span className="item-number">#{index + 1}</span>
                        <button className="remove-btn" onClick={() => removeItem('education', index)}>
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Institution</label>
                            <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateItem('education', index, 'institution', e.target.value)}
                                placeholder="Stanford University"
                            />
                        </div>
                        <div className="form-group">
                            <label>Degree</label>
                            <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateItem('education', index, 'degree', e.target.value)}
                                placeholder="Bachelor of Science"
                            />
                        </div>
                        <div className="form-group">
                            <label>Field of Study</label>
                            <input
                                type="text"
                                value={edu.field}
                                onChange={(e) => updateItem('education', index, 'field', e.target.value)}
                                placeholder="Computer Science"
                            />
                        </div>
                        <div className="form-group">
                            <label>GPA (Optional)</label>
                            <input
                                type="text"
                                value={edu.gpa}
                                onChange={(e) => updateItem('education', index, 'gpa', e.target.value)}
                                placeholder="3.8/4.0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="month"
                                value={edu.startDate}
                                onChange={(e) => updateItem('education', index, 'startDate', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="month"
                                value={edu.endDate}
                                onChange={(e) => updateItem('education', index, 'endDate', e.target.value)}
                            />
                        </div>
                    </div>
                </motion.div>
            ))}

            {resumeData.education.length === 0 && (
                <div className="empty-state">
                    <GraduationCap size={48} />
                    <p>No education added yet</p>
                    <button className="add-btn" onClick={() => addItem('education')}>
                        <Plus size={16} /> Add Education
                    </button>
                </div>
            )}
        </div>
    );

    const renderSkillsForm = () => (
        <div className="form-section">
            <div className="section-header">
                <h3>Skills</h3>
                <button className="add-btn" onClick={() => addItem('skills')}>
                    <Plus size={16} /> Add Skill
                </button>
            </div>

            <div className="skills-grid">
                {resumeData.skills.map((skill, index) => (
                    <motion.div
                        key={index}
                        className="skill-item"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => updateItem('skills', index, 'name', e.target.value)}
                            placeholder="React.js"
                        />
                        <div className="skill-level">
                            {[1, 2, 3, 4, 5].map(level => (
                                <button
                                    key={level}
                                    className={`level-dot ${skill.level >= level ? 'active' : ''}`}
                                    onClick={() => updateItem('skills', index, 'level', level)}
                                />
                            ))}
                        </div>
                        <button className="remove-btn small" onClick={() => removeItem('skills', index)}>
                            <Trash2 size={14} />
                        </button>
                    </motion.div>
                ))}
            </div>

            {resumeData.skills.length === 0 && (
                <div className="empty-state">
                    <Code size={48} />
                    <p>No skills added yet</p>
                    <button className="add-btn" onClick={() => addItem('skills')}>
                        <Plus size={16} /> Add Your First Skill
                    </button>
                </div>
            )}
        </div>
    );

    const renderProjectsForm = () => (
        <div className="form-section">
            <div className="section-header">
                <h3>Projects</h3>
                <button className="add-btn" onClick={() => addItem('projects')}>
                    <Plus size={16} /> Add Project
                </button>
            </div>

            {resumeData.projects.map((project, index) => (
                <motion.div
                    key={index}
                    className="item-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="item-header">
                        <span className="item-number">#{index + 1}</span>
                        <button className="remove-btn" onClick={() => removeItem('projects', index)}>
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Project Name</label>
                            <input
                                type="text"
                                value={project.name}
                                onChange={(e) => updateItem('projects', index, 'name', e.target.value)}
                                placeholder="E-commerce Platform"
                            />
                        </div>
                        <div className="form-group">
                            <label>Technologies</label>
                            <input
                                type="text"
                                value={project.technologies}
                                onChange={(e) => updateItem('projects', index, 'technologies', e.target.value)}
                                placeholder="React, Node.js, PostgreSQL"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Project Link (Optional)</label>
                            <input
                                type="url"
                                value={project.link}
                                onChange={(e) => updateItem('projects', index, 'link', e.target.value)}
                                placeholder="https://github.com/username/project"
                            />
                        </div>
                    </div>
                    <div className="form-group full-width">
                        <label>Description</label>
                        <textarea
                            value={project.description}
                            onChange={(e) => updateItem('projects', index, 'description', e.target.value)}
                            placeholder="Describe the project, your role, and key achievements..."
                            rows={3}
                        />
                    </div>
                </motion.div>
            ))}

            {resumeData.projects.length === 0 && (
                <div className="empty-state">
                    <Award size={48} />
                    <p>No projects added yet</p>
                    <button className="add-btn" onClick={() => addItem('projects')}>
                        <Plus size={16} /> Add Project
                    </button>
                </div>
            )}
        </div>
    );

    const renderCertificationsForm = () => (
        <div className="form-section">
            <div className="section-header">
                <h3>Certifications</h3>
                <button className="add-btn" onClick={() => addItem('certifications')}>
                    <Plus size={16} /> Add Certification
                </button>
            </div>

            {resumeData.certifications.map((cert, index) => (
                <motion.div
                    key={index}
                    className="item-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="item-header">
                        <span className="item-number">#{index + 1}</span>
                        <button className="remove-btn" onClick={() => removeItem('certifications', index)}>
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Certification Name</label>
                            <input
                                type="text"
                                value={cert.name}
                                onChange={(e) => updateItem('certifications', index, 'name', e.target.value)}
                                placeholder="AWS Solutions Architect"
                            />
                        </div>
                        <div className="form-group">
                            <label>Issuing Organization</label>
                            <input
                                type="text"
                                value={cert.issuer}
                                onChange={(e) => updateItem('certifications', index, 'issuer', e.target.value)}
                                placeholder="Amazon Web Services"
                            />
                        </div>
                        <div className="form-group">
                            <label>Date Obtained</label>
                            <input
                                type="month"
                                value={cert.date}
                                onChange={(e) => updateItem('certifications', index, 'date', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Credential Link (Optional)</label>
                            <input
                                type="url"
                                value={cert.link}
                                onChange={(e) => updateItem('certifications', index, 'link', e.target.value)}
                                placeholder="https://credential.net/..."
                            />
                        </div>
                    </div>
                </motion.div>
            ))}

            {resumeData.certifications.length === 0 && (
                <div className="empty-state">
                    <Award size={48} />
                    <p>No certifications added yet</p>
                    <button className="add-btn" onClick={() => addItem('certifications')}>
                        <Plus size={16} /> Add Certification
                    </button>
                </div>
            )}
        </div>
    );

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'personal': return renderPersonalForm();
            case 'experience': return renderExperienceForm();
            case 'education': return renderEducationForm();
            case 'skills': return renderSkillsForm();
            case 'projects': return renderProjectsForm();
            case 'certifications': return renderCertificationsForm();
            default: return renderPersonalForm();
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month] = dateStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const renderPreview = () => (
        <div className={`resume-preview template-${selectedTemplate}`} ref={previewRef}>
            <div className="resume-header">
                <h1>{resumeData.personal.firstName} {resumeData.personal.lastName}</h1>
                {resumeData.personal.title && <p className="title">{resumeData.personal.title}</p>}

                <div className="contact-info">
                    {resumeData.personal.email && <span><Mail size={12} /> {resumeData.personal.email}</span>}
                    {resumeData.personal.phone && <span><Phone size={12} /> {resumeData.personal.phone}</span>}
                    {resumeData.personal.location && <span><MapPin size={12} /> {resumeData.personal.location}</span>}
                    {resumeData.personal.linkedin && <span><Linkedin size={12} /> {resumeData.personal.linkedin}</span>}
                    {resumeData.personal.github && <span><Github size={12} /> {resumeData.personal.github}</span>}
                </div>
            </div>

            {resumeData.personal.summary && (
                <div className="resume-section">
                    <h2>Summary</h2>
                    <p>{resumeData.personal.summary}</p>
                </div>
            )}

            {resumeData.experience.length > 0 && (
                <div className="resume-section">
                    <h2>Experience</h2>
                    {resumeData.experience.map((exp, index) => (
                        <div key={index} className="resume-item">
                            <div className="item-top">
                                <h3>{exp.title}</h3>
                                <span className="date">
                                    {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                                </span>
                            </div>
                            <p className="company">{exp.company} {exp.location && `• ${exp.location}`}</p>
                            {exp.description && (
                                <div className="description">
                                    {exp.description.split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {resumeData.education.length > 0 && (
                <div className="resume-section">
                    <h2>Education</h2>
                    {resumeData.education.map((edu, index) => (
                        <div key={index} className="resume-item">
                            <div className="item-top">
                                <h3>{edu.degree} in {edu.field}</h3>
                                <span className="date">
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                </span>
                            </div>
                            <p className="company">{edu.institution} {edu.gpa && `• GPA: ${edu.gpa}`}</p>
                        </div>
                    ))}
                </div>
            )}

            {resumeData.skills.length > 0 && (
                <div className="resume-section">
                    <h2>Skills</h2>
                    <div className="skills-list">
                        {resumeData.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill.name}</span>
                        ))}
                    </div>
                </div>
            )}

            {resumeData.projects.length > 0 && (
                <div className="resume-section">
                    <h2>Projects</h2>
                    {resumeData.projects.map((project, index) => (
                        <div key={index} className="resume-item">
                            <h3>{project.name}</h3>
                            {project.technologies && <p className="technologies">{project.technologies}</p>}
                            {project.description && <p className="description">{project.description}</p>}
                        </div>
                    ))}
                </div>
            )}

            {resumeData.certifications.length > 0 && (
                <div className="resume-section">
                    <h2>Certifications</h2>
                    {resumeData.certifications.map((cert, index) => (
                        <div key={index} className="resume-item">
                            <div className="item-top">
                                <h3>{cert.name}</h3>
                                <span className="date">{formatDate(cert.date)}</span>
                            </div>
                            <p className="company">{cert.issuer}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="resume-builder">
            <div className="builder-header">
                <div className="header-left">
                    <FileText size={24} />
                    <h1>Resume Builder</h1>
                    <span className="beta-badge">Beta</span>
                </div>
                <div className="header-actions">
                    <button className="action-btn secondary" onClick={handleLoadResume}>
                        Load
                    </button>
                    <button className="action-btn secondary" onClick={handleSaveResume}>
                        <Save size={16} /> Save
                    </button>
                    <button className="action-btn secondary" onClick={() => setPreviewMode(!previewMode)}>
                        <Eye size={16} /> {previewMode ? 'Edit' : 'View'}
                    </button>
                    <button className="action-btn primary" onClick={handleExportPDF}>
                        <Download size={16} /> PDF
                    </button>
                    <button className="action-btn ai-assist" onClick={handleAISuggest}>
                        <Sparkles size={16} /> AI
                    </button>
                </div>
            </div>

            <div className="builder-content">
                {!previewMode && (
                    <div className="builder-sidebar">
                        <div className="template-selector">
                            <h3>Template</h3>
                            <div className="templates">
                                {templates.map(template => (
                                    <button
                                        key={template.id}
                                        className={`template-btn ${selectedTemplate === template.id ? 'active' : ''}`}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        style={{ '--accent': template.color }}
                                    >
                                        <div className="template-preview" />
                                        <span>{template.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="section-nav">
                            <h3>Sections</h3>
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    className={`section-btn ${activeSection === section.id ? 'active' : ''}`}
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    <section.icon size={18} />
                                    <span>{section.name}</span>
                                    {section.id !== 'personal' && (
                                        <span className="badge">
                                            {resumeData[section.id]?.length || 0}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="ai-assist">
                            <button className="ai-btn">
                                <Sparkles size={18} />
                                <span>AI Suggestions</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className={`builder-main ${previewMode ? 'full-width' : ''}`}>
                    {previewMode ? renderPreview() : renderActiveSection()}
                </div>

                {!previewMode && (
                    <div className="builder-preview-panel">
                        <h3>Live Preview</h3>
                        {renderPreview()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeBuilder;
