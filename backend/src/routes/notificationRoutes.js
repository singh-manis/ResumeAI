import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all notifications for the current user
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: req.user.id,
                isRead: false
            }
        });

        res.json({
            notifications: notifications.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                metadata: n.metadata,
                read: n.isRead,
                createdAt: n.createdAt
            })),
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark a notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.updateMany({
            where: {
                id,
                userId: req.user.id
            },
            data: {
                isRead: true
            }
        });

        if (notification.count === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Delete a notification
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.deleteMany({
            where: {
                id,
                userId: req.user.id
            }
        });

        if (notification.count === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Clear all notifications
router.delete('/', authenticate, async (req, res) => {
    try {
        await prisma.notification.deleteMany({
            where: {
                userId: req.user.id
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

// Helper function to create notifications (exported for use in other routes)
export const createNotification = async (userId, type, title, message, metadata = null) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                metadata
            }
        });
        // Setup real-time socket mechanism dynamically
        const ioInstance = global.io;
        if (ioInstance) {
            console.log(`[Socket] Emitting new_notification to room: user_${userId}`);
            ioInstance.to(`user_${userId}`).emit('new_notification', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                metadata: notification.metadata,
                read: notification.isRead,
                createdAt: notification.createdAt
            });
        }


        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export default router;
