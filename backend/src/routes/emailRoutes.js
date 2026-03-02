import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize email service on first request
let emailInitialized = false;

const ensureEmailInit = async () => {
    if (!emailInitialized) {
        await emailService.init();
        emailInitialized = true;
    }
};

// Send test email (admin only, for testing)
router.post('/test', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        await ensureEmailInit();

        const result = await emailService.sendEmail({
            to: req.user.email,
            subject: 'Test Email from Resume Analyzer',
            html: '<h1>Test Email</h1><p>If you received this, email is working correctly!</p>'
        });

        if (result.success) {
            res.json({ message: 'Test email sent successfully', messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ error: 'Failed to send test email' });
    }
});

// Send welcome email manually (if not sent during registration)
router.post('/welcome', authenticate, async (req, res) => {
    try {
        await ensureEmailInit();

        const result = await emailService.sendWelcomeEmail(req.user);

        if (result.success) {
            res.json({ message: 'Welcome email sent successfully' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error sending welcome email:', error);
        res.status(500).json({ error: 'Failed to send welcome email' });
    }
});

// Resend interview confirmation email
router.post('/resend-interview/:interviewId', authenticate, async (req, res) => {
    try {
        await ensureEmailInit();

        const { interviewId } = req.params;

        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: {
                            include: {
                                recruiter: true
                            }
                        }
                    }
                }
            }
        });

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Check authorization
        const isRecruiter = interview.application.job.recruiterId === req.user.id;
        const isCandidate = interview.application.candidateId === req.user.id;

        if (!isRecruiter && !isCandidate && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await emailService.sendInterviewScheduledEmail(
            interview,
            interview.application.candidate,
            interview.application.job,
            interview.application.job.recruiter
        );

        if (result.success) {
            res.json({ message: 'Interview confirmation email resent successfully' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error resending interview email:', error);
        res.status(500).json({ error: 'Failed to resend interview email' });
    }
});

// Send batch notifications for pending interviews (admin/cron job)
router.post('/send-reminders', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        await ensureEmailInit();

        // Find interviews scheduled within the next 24 hours
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingInterviews = await prisma.interview.findMany({
            where: {
                scheduledAt: {
                    gte: now,
                    lte: tomorrow
                },
                status: {
                    in: ['SCHEDULED', 'CONFIRMED']
                }
            },
            include: {
                application: {
                    include: {
                        candidate: true,
                        job: true
                    }
                }
            }
        });

        let sentCount = 0;
        const errors = [];

        for (const interview of upcomingInterviews) {
            try {
                await emailService.sendInterviewReminderEmail(
                    interview,
                    interview.application.candidate,
                    interview.application.job
                );
                sentCount++;
            } catch (error) {
                errors.push({
                    interviewId: interview.id,
                    error: error.message
                });
            }
        }

        res.json({
            message: `Sent ${sentCount} reminder emails`,
            total: upcomingInterviews.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error sending reminder emails:', error);
        res.status(500).json({ error: 'Failed to send reminder emails' });
    }
});

// Get email preferences
router.get('/preferences', authenticate, async (req, res) => {
    try {
        // For now, return default preferences
        // In production, this would query a user_preferences table
        res.json({
            applicationUpdates: true,
            interviewReminders: true,
            newMatches: true,
            weeklyDigest: false,
            marketingEmails: false
        });
    } catch (error) {
        console.error('Error getting email preferences:', error);
        res.status(500).json({ error: 'Failed to get email preferences' });
    }
});

// Update email preferences
router.put('/preferences', authenticate, async (req, res) => {
    try {
        const { applicationUpdates, interviewReminders, newMatches, weeklyDigest, marketingEmails } = req.body;

        // In production, this would update a user_preferences table
        // For now, just return success
        res.json({
            message: 'Email preferences updated successfully',
            preferences: {
                applicationUpdates: applicationUpdates ?? true,
                interviewReminders: interviewReminders ?? true,
                newMatches: newMatches ?? true,
                weeklyDigest: weeklyDigest ?? false,
                marketingEmails: marketingEmails ?? false
            }
        });
    } catch (error) {
        console.error('Error updating email preferences:', error);
        res.status(500).json({ error: 'Failed to update email preferences' });
    }
});

export default router;
