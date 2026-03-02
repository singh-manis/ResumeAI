import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all saved jobs for the current user
router.get('/', authenticate, authorize('CANDIDATE'), async (req, res) => {
    try {
        const savedJobs = await prisma.savedJob.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                job: {
                    include: {
                        recruiter: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true
                            }
                        },
                        skills: {
                            include: {
                                skill: true
                            }
                        },
                        _count: {
                            select: {
                                applications: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            savedJobs: savedJobs.map(sj => ({
                id: sj.id,
                notes: sj.notes,
                savedAt: sj.createdAt,
                job: {
                    ...sj.job,
                    skills: sj.job.skills.map(js => ({
                        ...js.skill,
                        isRequired: js.isRequired
                    })),
                    applicationCount: sj.job._count.applications
                }
            }))
        });
    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({ error: 'Failed to fetch saved jobs' });
    }
});

// Save a job
router.post('/:jobId', authenticate, authorize('CANDIDATE'), async (req, res) => {
    try {
        const { jobId } = req.params;
        const { notes } = req.body;

        // Check if job exists
        const job = await prisma.job.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Check if already saved
        const existing = await prisma.savedJob.findUnique({
            where: {
                userId_jobId: {
                    userId: req.user.id,
                    jobId
                }
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Job already saved' });
        }

        const savedJob = await prisma.savedJob.create({
            data: {
                userId: req.user.id,
                jobId,
                notes
            }
        });

        res.status(201).json({
            message: 'Job saved successfully',
            savedJob
        });
    } catch (error) {
        console.error('Error saving job:', error);
        res.status(500).json({ error: 'Failed to save job' });
    }
});

// Update saved job notes
router.patch('/:jobId', authenticate, authorize('CANDIDATE'), async (req, res) => {
    try {
        const { jobId } = req.params;
        const { notes } = req.body;

        const savedJob = await prisma.savedJob.update({
            where: {
                userId_jobId: {
                    userId: req.user.id,
                    jobId
                }
            },
            data: { notes }
        });

        res.json({
            message: 'Notes updated',
            savedJob
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Saved job not found' });
        }
        console.error('Error updating saved job:', error);
        res.status(500).json({ error: 'Failed to update saved job' });
    }
});

// Unsave a job
router.delete('/:jobId', authenticate, authorize('CANDIDATE'), async (req, res) => {
    try {
        const { jobId } = req.params;

        await prisma.savedJob.delete({
            where: {
                userId_jobId: {
                    userId: req.user.id,
                    jobId
                }
            }
        });

        res.json({ message: 'Job removed from saved' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Saved job not found' });
        }
        console.error('Error removing saved job:', error);
        res.status(500).json({ error: 'Failed to remove saved job' });
    }
});

// Check if a job is saved
router.get('/check/:jobId', authenticate, authorize('CANDIDATE'), async (req, res) => {
    try {
        const { jobId } = req.params;

        const savedJob = await prisma.savedJob.findUnique({
            where: {
                userId_jobId: {
                    userId: req.user.id,
                    jobId
                }
            }
        });

        res.json({ isSaved: !!savedJob });
    } catch (error) {
        console.error('Error checking saved job:', error);
        res.status(500).json({ error: 'Failed to check saved status' });
    }
});

export default router;
