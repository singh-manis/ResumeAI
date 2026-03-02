import { startInterviewSession, chatInInterview } from '../services/aiService.js';
import { addXP } from './gamificationController.js';
import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';

export const startInterview = async (req, res) => {
    try {
        const { role, techStack, experience } = req.body;

        if (!role || !techStack || !experience) {
            return res.status(400).json({ message: 'Role, tech stack, and experience are required' });
        }

        const initialMessage = await startInterviewSession(role, techStack, experience);

        // Award XP for starting an interview session
        if (req.user) {
            try {
                await addXP(req.user.id, 20);
            } catch (error) {
                console.error('Failed to award XP:', error);
            }
        }

        res.json({ message: initialMessage });
    } catch (error) {
        console.error('Start Interview Error:', error);
        res.status(500).json({ message: 'Failed to start interview' });
    }
};

export const processInterviewChat = async (req, res) => {
    try {
        const { message, history, context } = req.body;
        const { role, techStack, experience } = context || {};

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const response = await chatInInterview(message, history || [], role, techStack, experience);
        res.json({ response });
    } catch (error) {
        console.error('Interview Chat Error:', error);
        res.status(500).json({ message: 'Failed to process chat' });
    }
};

// --- Human Interviews ---

export const getInterviews = async (req, res) => {
    // Determine filters
    const { status, upcoming } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
        where.status = status;
    }

    if (upcoming === 'true') {
        where.scheduledAt = { gt: new Date() };
    }

    if (req.user.role === 'RECRUITER') {
        // Recruiters see interviews for applications to their jobs
        where.application = {
            job: { recruiterId: req.user.id }
        };
    } else if (req.user.role === 'CANDIDATE') {
        // Candidates see interviews for their applications
        where.application = {
            candidateId: req.user.id
        };
    }

    try {
        const interviews = await prisma.interview.findMany({
            where,
            include: {
                application: {
                    include: {
                        candidate: {
                            select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
                        },
                        job: {
                            select: { id: true, title: true, company: true }
                        }
                    }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        res.json({ interviews });
    } catch (error) {
        console.error('getInterviews ERROR:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

export const scheduleInterview = async (req, res) => {
    const { applicationId, scheduledAt, duration, type, location, notes } = req.body;

    if (!applicationId || !scheduledAt) {
        throw new AppError('Application ID and scheduled time are required', 400);
    }

    // Verify application exists and belongs to recruiter's job
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true }
    });

    if (!application) {
        throw new AppError('Application not found', 404);
    }

    if (application.job.recruiterId !== req.user.id) {
        throw new AppError('Unauthorized to schedule for this job', 403);
    }

    // Auto-generate Jitsi link for video interviews
    let meetingLink = req.body.meetingLink || null;
    if (type === 'VIDEO' && !meetingLink) {
        meetingLink = `https://meet.jit.si/TimziInterview-${Math.random().toString(36).substring(2, 12)}-${Date.now()}`;
    }

    const interview = await prisma.interview.create({
        data: {
            applicationId,
            scheduledAt: new Date(scheduledAt),
            duration: duration ? parseInt(duration) : 60,
            type: type || 'VIDEO',
            location,
            meetingLink,
            notes,
            status: 'SCHEDULED'
        },
        include: {
            application: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
                    job: { select: { id: true, title: true, company: true } }
                }
            }
        }
    });

    res.status(201).json({ message: 'Interview scheduled', interview });
};

export const updateInterview = async (req, res) => {
    const { id } = req.params;
    const { status, scheduledAt, location, meetingLink, notes, feedback, rating } = req.body;

    // Verify interview exists
    const existing = await prisma.interview.findUnique({
        where: { id },
        include: { application: { include: { job: true } } }
    });

    if (!existing) {
        throw new AppError('Interview not found', 404);
    }

    // Only recruiter who owns the job can update, or candidates updating generic info?
    // Let's restrict to recruiter for major updates. Candidates can perhaps cancel?
    // For simplicity, we'll allow recruiters full access, and candidates can only update status to CANCELLED/RESCHEDULED.
    if (req.user.role === 'CANDIDATE') {
        if (existing.application.candidateId !== req.user.id) {
            throw new AppError('Unauthorized', 403);
        }
        // Candidate can only update status (e.g. to cancel)
        if (status !== 'CANCELLED' && status !== 'RESCHEDULED') {
            throw new AppError('Candidates can only cancel or reschedule', 403);
        }
    } else if (req.user.role === 'RECRUITER') {
        if (existing.application.job.recruiterId !== req.user.id) {
            throw new AppError('Unauthorized', 403);
        }
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (req.user.role === 'RECRUITER') {
        if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
        if (location !== undefined) updateData.location = location;
        if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
        if (notes !== undefined) updateData.notes = notes;
        if (feedback !== undefined) updateData.feedback = feedback;
        if (rating !== undefined) updateData.rating = rating;
    }

    const interview = await prisma.interview.update({
        where: { id },
        data: updateData,
        include: {
            application: {
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
                    job: { select: { id: true, title: true, company: true } }
                }
            }
        }
    });

    res.json({ message: 'Interview updated', interview });
};

export const deleteInterview = async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.interview.findUnique({
        where: { id },
        include: { application: { include: { job: true } } }
    });

    if (!existing) {
        throw new AppError('Interview not found', 404);
    }

    if (req.user.role === 'RECRUITER' && existing.application.job.recruiterId !== req.user.id) {
        throw new AppError('Unauthorized', 403);
    } else if (req.user.role === 'CANDIDATE') {
        throw new AppError('Candidates cannot delete interviews', 403);
    }

    await prisma.interview.delete({ where: { id } });

    res.json({ message: 'Interview deleted' });
};
