import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    X,
    Check,
    CheckCheck,
    Trash2,
    FileText,
    Briefcase,
    Target,
    Users,
    Sparkles,
    Clock,
    MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationBell.css';

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotifications();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'APPLICATION_RECEIVED':
            case 'APPLICATION_STATUS':
                return <Users size={16} />;
            case 'RESUME_ANALYZED':
                return <FileText size={16} />;
            case 'JOB_MATCH':
                return <Target size={16} />;
            case 'JOB_POSTED':
                return <Briefcase size={16} />;
            case 'MESSAGE':
                return <MessageSquare size={16} />;
            default:
                return <Sparkles size={16} />;
        }
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="notification-dropdown"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            <div className="header-actions">
                                {unreadCount > 0 && (
                                    <button className="mark-all-btn" onClick={markAllAsRead} title="Mark all as read">
                                        <CheckCheck size={16} />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button className="clear-all-btn" onClick={clearAll} title="Clear all">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="notification-list">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => {
                                            markAsRead(notification.id);
                                            setIsOpen(false);
                                            if (notification.type === 'MESSAGE') {
                                                const basePath = user?.role === 'RECRUITER' ? '/recruiter/messages' : '/candidate/messages';
                                                navigate(basePath);
                                            }
                                        }}
                                    >
                                        <div className={`notification-icon ${notification.type?.toLowerCase()}`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <strong>{notification.title}</strong>
                                            <p>{notification.message}</p>
                                            <span className="notification-time">
                                                <Clock size={12} />
                                                {getTimeAgo(notification.createdAt)}
                                            </span>
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="no-notifications">
                                    <Bell size={32} />
                                    <p>No notifications</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 5 && (
                            <div className="notification-footer">
                                <button>View All Notifications</button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
