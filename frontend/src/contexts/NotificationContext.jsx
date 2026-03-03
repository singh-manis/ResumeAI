import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Now that SocketProvider is the parent of NotificationProvider,
    // we can safely call this hook directly.
    const { socket } = useSocket();

    const fetchNotifications = useCallback(async () => {
        // Only fetch if user is authenticated (has token)
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            // Don't log 401 errors - they're expected when not logged in
            if (error.response?.status !== 401) {
                console.error('Failed to fetch notifications:', error);
            }
            // Use mock data for demo only when logged in
            if (error.response?.status !== 401) {
                const mockNotifications = [
                    {
                        id: '1',
                        type: 'APPLICATION_RECEIVED',
                        title: 'New Application',
                        message: 'John Developer applied to Senior Software Engineer',
                        read: false,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: '2',
                        type: 'RESUME_ANALYZED',
                        title: 'Resume Analysis Complete',
                        message: 'Your resume has been analyzed. ATS Score: 85%',
                        read: false,
                        createdAt: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        id: '3',
                        type: 'JOB_MATCH',
                        title: 'New Job Match',
                        message: 'You have a 92% match with "Full Stack Developer" at TechCorp',
                        read: true,
                        createdAt: new Date(Date.now() - 86400000).toISOString()
                    }
                ];
                setNotifications(mockNotifications);
                setUnreadCount(mockNotifications.filter(n => !n.read).length);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            // Update locally even if API fails
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            const notification = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            const notification = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications');
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    // Add a new notification locally (for real-time updates)
    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
        }
    };

    useEffect(() => {
        // Only start fetching if token exists
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchNotifications]);

    // Handle incoming realtime socket messages to show as notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            // Check if we are the sender of a message to avoid self-notifications
            // But the backend already handles self-notification prevention since it looks up the recipientId
            addNotification(notification);
        };

        socket.on('new_notification', handleNewNotification);
        return () => socket.off('new_notification', handleNewNotification);
    }, [socket]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                clearAll,
                addNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;

