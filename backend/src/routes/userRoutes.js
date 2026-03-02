import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            phone: true,
            linkedinUrl: true,
            location: true,
            bio: true,
            isVerified: true,
            createdAt: true,
            lastLoginAt: true
        }
    });

    res.json({ user });
}));

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 */
router.put('/me', authenticate, asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, linkedinUrl, location, bio } = req.body;

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            firstName,
            lastName,
            phone,
            linkedinUrl,
            location,
            bio
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            phone: true,
            linkedinUrl: true,
            location: true,
            bio: true
        }
    });

    res.json({ message: 'Profile updated', user });
}));

/**
 * @route   POST /api/users/me/avatar
 * @desc    Upload user avatar
 */
import { uploadAvatar } from '../middleware/upload.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload an image file' });
    }

    try {
        const fileBuffer = req.file.buffer;
        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(fileBuffer, 'avatars', 'image');

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                avatar: cloudinaryResult.secure_url
            },
            select: {
                id: true,
                avatar: true
            }
        });

        res.json({ message: 'Avatar updated successfully', user });
    } catch (error) {
        console.error('Avatar Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
}));

/**
 * @route   PUT /api/users/me/password
 * @desc    Change password
 */
router.put('/me/password', authenticate, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash }
    });

    res.json({ message: 'Password updated successfully' });
}));

/**
 * @route   DELETE /api/users/me
 * @desc    Delete account
 */
router.delete('/me', authenticate, asyncHandler(async (req, res) => {
    await prisma.user.delete({
        where: { id: req.user.id }
    });

    res.clearCookie('refreshToken');
    res.json({ message: 'Account deleted successfully' });
}));

export default router;
