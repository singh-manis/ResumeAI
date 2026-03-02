import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role = 'CANDIDATE' } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
        throw new AppError('All fields are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new AppError('Invalid email format', 400);
    }

    // Validate password strength
    if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Validate role
    const validRoles = ['CANDIDATE', 'RECRUITER'];
    if (!validRoles.includes(role)) {
        throw new AppError('Invalid role. Must be CANDIDATE or RECRUITER', 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (existingUser) {
        throw new AppError('Email already registered', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: email.toLowerCase(),
            passwordHash,
            firstName,
            lastName,
            role
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true
        }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
        message: 'Registration successful',
        user,
        accessToken
    });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
        throw new AppError('Your account has been deactivated', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar
        },
        accessToken
    });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
        throw new AppError('Refresh token required', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        // Check if user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, isActive: true }
        });

        if (!user || !user.isActive) {
            throw new AppError('User not found or inactive', 401);
        }

        // Generate new tokens
        const tokens = generateTokens(user.id);

        // Set new refresh token
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            accessToken: tokens.accessToken
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Refresh token expired. Please log in again.', 401);
        }
        throw new AppError('Invalid refresh token', 401);
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    res.json({ message: 'Logout successful' });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('Email is required', 400);
    }

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    res.json({
        message: 'If an account exists with this email, a password reset link will be sent.'
    });

    // TODO: Implement email sending logic here
    // For now, we'll just log it in development
    if (user && process.env.NODE_ENV === 'development') {
        console.log(`Password reset requested for: ${email}`);
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
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
            lastLoginAt: true,
            _count: {
                select: {
                    resumes: true,
                    jobs: true,
                    applications: true
                }
            }
        }
    });

    res.json({ user });
});

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, bio, location, linkedinUrl } = req.body;

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone !== undefined && { phone }),
            ...(bio !== undefined && { bio }),
            ...(location !== undefined && { location }),
            ...(linkedinUrl !== undefined && { linkedinUrl })
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
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new AppError('Current and new password are required', 400);
    }

    if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash }
    });

    res.json({ message: 'Password changed successfully' });
});

/**
 * @route   PATCH /api/auth/notification-settings
 * @desc    Update notification preferences
 * @access  Private
 */
export const updateNotificationSettings = asyncHandler(async (req, res) => {
    // For now, just acknowledge the request
    // In a full implementation, you'd store these in a UserSettings table
    res.json({ message: 'Notification preferences updated' });
});

