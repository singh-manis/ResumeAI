import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 */
router.get('/users', asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (role) {
        where.role = role;
    }

    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        resumes: true,
                        jobs: true,
                        applications: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit)
        }),
        prisma.user.count({ where })
    ]);

    res.json({
        users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
}));

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details
 */
router.get('/users/:id', asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
            resumes: {
                select: { id: true, title: true, atsScore: true, createdAt: true }
            },
            jobs: {
                select: { id: true, title: true, company: true, isActive: true }
            },
            applications: {
                select: { id: true, status: true, appliedAt: true }
            }
        }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Don't return password hash
    const { passwordHash, ...userData } = user;

    res.json({ user: userData });
}));

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 */
router.put('/users/:id', asyncHandler(async (req, res) => {
    const { firstName, lastName, role, isActive, isVerified } = req.body;

    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
            firstName,
            lastName,
            role,
            isActive,
            isVerified
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true
        }
    });

    res.json({ message: 'User updated', user });
}));

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Partially update user status (e.g. isActive)
 */
router.patch('/users/:id', asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
            ...(isActive !== undefined && { isActive })
        },
        select: {
            id: true,
            isActive: true
        }
    });

    res.json({ message: 'User status updated', user });
}));

/**
 * @route   PUT /api/admin/users/:id/reset-password
 * @desc    Reset user password
 */
router.put('/users/:id/reset-password', asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: req.params.id },
        data: { passwordHash }
    });

    res.json({ message: 'Password reset successful' });
}));

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 */
router.delete('/users/:id', asyncHandler(async (req, res) => {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
        throw new AppError('Cannot delete your own account', 400);
    }

    await prisma.user.delete({
        where: { id: req.params.id }
    });

    res.json({ message: 'User deleted' });
}));

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalResumes,
        totalJobs,
        totalApplications,
        totalMatches
    ] = await Promise.all([
        prisma.user.count(),
        prisma.resume.count(),
        prisma.job.count(),
        prisma.application.count(),
        prisma.match.count()
    ]);

    const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true
    });

    const applicationsByStatus = await prisma.application.groupBy({
        by: ['status'],
        _count: true
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        newUsersToday,
        newJobsToday,
        newApplicationsToday
    ] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.job.count({ where: { createdAt: { gte: today } } }),
        prisma.application.count({ where: { appliedAt: { gte: today } } })
    ]);

    res.json({
        totals: {
            users: totalUsers,
            resumes: totalResumes,
            jobs: totalJobs,
            applications: totalApplications,
            matches: totalMatches
        },
        usersByRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count;
            return acc;
        }, {}),
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {}),
        today: {
            newUsers: newUsersToday,
            newJobs: newJobsToday,
            newApplications: newApplicationsToday
        }
    });
}));

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 */
router.get('/settings', asyncHandler(async (req, res) => {
    const settings = await prisma.systemSettings.findMany();

    const settingsObj = settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
    }, {});

    res.json({ settings: settingsObj });
}));

/**
 * @route   PUT /api/admin/settings
 * @desc    Update system settings
 */
router.put('/settings', asyncHandler(async (req, res) => {
    const { settings } = req.body;

    for (const [key, value] of Object.entries(settings)) {
        await prisma.systemSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
    }

    res.json({ message: 'Settings updated' });
}));

export default router;
