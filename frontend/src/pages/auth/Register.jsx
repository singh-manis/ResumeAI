import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Sparkles, Briefcase, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'CANDIDATE'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const user = await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role
            });

            toast.success(`Welcome, ${user.firstName}! Your account has been created.`);

            // Redirect based on role
            switch (user.role) {
                case 'CANDIDATE':
                    navigate('/candidate');
                    break;
                case 'RECRUITER':
                    navigate('/recruiter');
                    break;
                default:
                    navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="split-auth-container">
            {/* Left side: Form */}
            <div className="split-auth-left">
                <motion.div
                    className="split-auth-box auth-card-register"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0 2rem' }}
                >
                    {/* Logo */}
                    <Link to="/" className="auth-logo" style={{ justifyContent: 'flex-start', marginBottom: '2.5rem' }}>
                        <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}>
                            <Sparkles size={20} />
                        </div>
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            letterSpacing: '-0.5px',
                            background: 'linear-gradient(135deg,#fff,#c7d2fe 60%,#f9a8d4)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Rezlo</span>
                    </Link>

                    <div className="auth-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
                        <p style={{ fontSize: '1rem' }}>Join us and start your journey</p>
                    </div>

                    <button
                        className="google-oauth-btn"
                        type="button"
                        onClick={() => {
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
                            window.location.href = `${apiUrl}/oauth/google`;
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign up with Google
                    </button>

                    <div className="auth-divider">
                        <span>or register with email</span>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Role Selection */}
                        <div className="role-selection">
                            <label>I am a</label>
                            <div className="role-options">
                                <button
                                    type="button"
                                    className={`role-btn ${formData.role === 'CANDIDATE' ? 'active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'CANDIDATE' }))}
                                >
                                    <User size={20} />
                                    <span>Job Seeker</span>
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${formData.role === 'RECRUITER' ? 'active' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'RECRUITER' }))}
                                >
                                    <Briefcase size={20} />
                                    <span>Recruiter</span>
                                </button>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <div className="input-wrapper">
                                    <User className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <div className="input-wrapper">
                                    <Users className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 8 characters"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="input-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input type="checkbox" required />
                                <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-footer" style={{ marginTop: '2rem', textAlign: 'left' }}>
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </motion.div>
            </div>

            {/* Right side: Visuals */}
            <div className="split-auth-right">
                <div className="visual-pane-glass"></div>
                <motion.div
                    className="visual-pane-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <h2>Your Next Great Hire Awaits</h2>
                    <p>
                        Whether you're looking for your next challenge or building your dream team, Rezlo provides the AI tools you need to succeed.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
