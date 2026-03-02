import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Lock,
    Bell,
    Shield,
    Palette,
    Save,
    Check,
    Eye,
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Settings.css';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [profile, setProfile] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || ''
    });

    const [password, setPassword] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [notifications, setNotifications] = useState({
        emailApplications: true,
        emailMatches: true,
        emailNewJobs: false,
        pushApplications: true,
        pushMatches: true,
        pushNewJobs: true
    });

    const tabs = [
        { id: 'profile', icon: <User size={18} />, label: 'Profile' },
        { id: 'password', icon: <Lock size={18} />, label: 'Password' },
        { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' }
    ];

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.patch('/auth/profile', profile);
            if (updateUser) updateUser(response.data.user);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (password.new !== password.confirm) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.new.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: password.current,
                newPassword: password.new
            });
            setPassword({ current: '', new: '', confirm: '' });
            toast.success('Password changed successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/auth/notification-settings', notifications);
            toast.success('Notification preferences updated');
        } catch (error) {
            toast.error('Failed to update notification preferences');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account settings and preferences</p>
            </div>

            <div className="settings-container">
                {/* Sidebar */}
                <div className="settings-sidebar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <motion.form
                            className="settings-form"
                            onSubmit={handleProfileSubmit}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="form-section">
                                <h2>Profile Information</h2>
                                <p>Update your personal information</p>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            value={profile.firstName}
                                            onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            value={profile.lastName}
                                            onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="disabled"
                                    />
                                    <span className="field-hint">Email cannot be changed</span>
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Bio</label>
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                                        placeholder="Tell us a bit about yourself..."
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : (
                                        <><Save size={18} /> Save Changes</>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {activeTab === 'password' && (
                        <motion.form
                            className="settings-form"
                            onSubmit={handlePasswordSubmit}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="form-section">
                                <h2>Change Password</h2>
                                <p>Ensure your account is using a secure password</p>

                                <div className="form-group">
                                    <label>Current Password</label>
                                    <div className="password-input">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password.current}
                                            onChange={(e) => setPassword(p => ({ ...p, current: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password.new}
                                        onChange={(e) => setPassword(p => ({ ...p, new: e.target.value }))}
                                    />
                                    <span className="field-hint">Minimum 8 characters</span>
                                </div>

                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password.confirm}
                                        onChange={(e) => setPassword(p => ({ ...p, confirm: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Updating...' : (
                                        <><Lock size={18} /> Update Password</>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.form
                            className="settings-form"
                            onSubmit={handleNotificationSubmit}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="form-section">
                                <h2>Email Notifications</h2>
                                <p>Manage your email notification preferences</p>

                                <div className="toggle-group">
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <strong>Application Updates</strong>
                                            <span>Receive emails when someone applies to your jobs</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notifications.emailApplications}
                                                onChange={(e) => setNotifications(n => ({
                                                    ...n, emailApplications: e.target.checked
                                                }))}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <strong>Job Matches</strong>
                                            <span>Get notified about new job matches</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notifications.emailMatches}
                                                onChange={(e) => setNotifications(n => ({
                                                    ...n, emailMatches: e.target.checked
                                                }))}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <strong>New Job Alerts</strong>
                                            <span>Receive emails when new jobs match your profile</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notifications.emailNewJobs}
                                                onChange={(e) => setNotifications(n => ({
                                                    ...n, emailNewJobs: e.target.checked
                                                }))}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h2>Push Notifications</h2>
                                <p>Manage in-app notification preferences</p>

                                <div className="toggle-group">
                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <strong>Application Updates</strong>
                                            <span>Show notifications for application updates</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notifications.pushApplications}
                                                onChange={(e) => setNotifications(n => ({
                                                    ...n, pushApplications: e.target.checked
                                                }))}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <strong>Job Matches</strong>
                                            <span>Show notifications for new job matches</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notifications.pushMatches}
                                                onChange={(e) => setNotifications(n => ({
                                                    ...n, pushMatches: e.target.checked
                                                }))}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="toggle-item">
                                        <div className="toggle-info">
                                            <strong>New Jobs</strong>
                                            <span>Show notifications for new job postings</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={notifications.pushNewJobs}
                                                onChange={(e) => setNotifications(n => ({
                                                    ...n, pushNewJobs: e.target.checked
                                                }))}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : (
                                        <><Check size={18} /> Save Preferences</>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
