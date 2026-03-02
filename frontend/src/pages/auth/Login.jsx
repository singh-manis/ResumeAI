import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
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
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);
            toast.success(`Welcome back, ${user.firstName}!`);

            // Redirect based on role
            switch (user.role) {
                case 'CANDIDATE':
                    navigate('/candidate');
                    break;
                case 'RECRUITER':
                    navigate('/recruiter');
                    break;
                case 'ADMIN':
                    navigate('/admin');
                    break;
                default:
                    navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="split-auth-container">
            {/* Left side: Form */}
            <div className="split-auth-left">
                <motion.div
                    className="split-auth-box auth-card"
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
                            WebkitTextFillColor: 'transparent',
                        }}>Rezlo</span>
                    </Link>

                    <div className="auth-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                        <p style={{ fontSize: '1rem' }}>Sign in to continue to your dashboard</p>
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
                        Continue with Google
                    </button>

                    <div className="auth-divider">
                        <span>or sign in with email</span>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
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
                                    placeholder="••••••••"
                                    required
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

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot password?
                            </Link>
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
                                    <LogIn size={18} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="demo-accounts" style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', textAlign: 'left' }}>
                        <p style={{ textAlign: 'left', marginBottom: '1rem' }}>Demo Accounts (Password: Demo123!)</p>
                        <div className="demo-buttons" style={{ justifyContent: 'flex-start' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ email: 'john.developer@gmail.com', password: 'Demo123!' })}
                                className="demo-btn"
                            >
                                Candidate
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ email: 'recruiter@techcorp.com', password: 'Demo123!' })}
                                className="demo-btn"
                            >
                                Recruiter
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ email: 'admin@resumeanalyzer.com', password: 'Admin123!' })}
                                className="demo-btn"
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    <p className="auth-footer" style={{ marginTop: '2rem', textAlign: 'left' }}>
                        Don't have an account?{' '}
                        <Link to="/register">Create one</Link>
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
                    <h2>Accelerate Your Career with AI</h2>
                    <p>
                        Join thousands of professionals using Rezlo's intelligent matching, automated insights, and smart job tracking to land their dream roles faster.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
