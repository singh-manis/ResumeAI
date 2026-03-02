import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Generate frontend callback URL (with fallback)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

/**
 * Initiates the Google OAuth flow
 */
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account' // Force account selection
    })
);

/**
 * Google OAuth Callback
 */
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` }),
    (req, res) => {
        try {
            // Check if user was authenticated successfully
            if (!req.user) {
                return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
            }

            // Generate JWT Token (matching the logic in authController.js)
            const token = jwt.sign(
                {
                    userId: req.user.id,
                    role: req.user.role,
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
            );

            // Redirect back to frontend with the token
            res.redirect(`${FRONTEND_URL}/oauth/callback?token=${token}`);
        } catch (error) {
            console.error('OAuth Callback Error:', error);
            res.redirect(`${FRONTEND_URL}/login?error=server_error`);
        }
    }
);

export default router;
