import express from 'express';
import {
    register,
    login,
    refreshToken,
    logout,
    forgotPassword,
    getMe,
    updateProfile,
    changePassword,
    updateNotificationSettings
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.patch('/notification-settings', authenticate, updateNotificationSettings);

export default router;
