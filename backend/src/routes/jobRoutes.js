import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { isRecruiter, isRecruiterOrAdmin } from '../middleware/rbac.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';
import { evaluateResumeMatch } from '../services/aiService.js';
import emailService from '../services/emailService.js';
import { createNotification } from './notificationRoutes.js';

const router = express.Router();

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 */
router.post('/', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const {
        title,
        company,
        companyLogo,
        description,
        requirements,
        location,
        workType,
        employmentType,
        salaryMin,
        salaryMax,
        salaryCurrency,
        skills,
        skillsRequired,   // optional map: { [skillNameLower]: boolean }
        expiresAt,
        deadline          // alias sent by JobForm frontend
    } = req.body;

    // Validate required fields
    if (!title || !company || !description) {
        throw new AppError('Title, company, and description are required', 400);
    }

    try {
        const job = await prisma.job.create({
            data: {
                recruiterId: req.user.id,
                title,
                company,
                companyLogo,
                description,
                requirements,
                location,
                workType: workType || 'ONSITE',
                employmentType: employmentType || 'FULL_TIME',
                salaryMin: salaryMin ? parseInt(salaryMin) : null,
                salaryMax: salaryMax ? parseInt(salaryMax) : null,
                salaryCurrency: salaryCurrency || 'USD',
                // Accept either `expiresAt` or `deadline` from frontend
                expiresAt: expiresAt ? new Date(expiresAt) : (deadline ? new Date(deadline) : null)
            }
        });

        // Add skills if provided
        if (skills && Array.isArray(skills)) {
            for (const rawSkill of skills) {
                // Defensive: handle if frontend accidentally sends an object instead of string
                const skillName = typeof rawSkill === 'string'
                    ? rawSkill.trim()
                    : (rawSkill?.name ?? '').trim();

                if (!skillName) continue;

                // Find or create skill record
                let skill = await prisma.skill.findUnique({
                    where: { name: skillName }
                });

                if (!skill) {
                    skill = await prisma.skill.create({
                        data: { name: skillName }
                    });
                }

                // Determine isRequired from optional map sent by frontend
                const isRequired = skillsRequired
                    ? !!(skillsRequired[skillName.toLowerCase()])
                    : true;

                // Create job-skill relationship
                await prisma.jobSkill.create({
                    data: {
                        jobId: job.id,
                        skillId: skill.id,
                        isRequired
                    }
                });
            }
        }

        res.status(201).json({
            message: 'Job posted successfully',
            job
        });
    } catch (err) {
        console.error("🔥 CRITICAL JOB CREATION ERROR:", err, "Body was:", req.body);
        throw err;
    }
}));

/**
 * @route   GET /api/jobs
 * @desc    Get all active jobs with filters
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
    const {
        search,
        location,
        workType,
        employmentType,
        minSalary,
        maxSalary,
        skills,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const where = {
        isActive: true
    };

    // Search filter
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }

    // Location filter
    if (location) {
        where.location = { contains: location, mode: 'insensitive' };
    }

    // Work type filter
    if (workType) {
        where.workType = workType;
    }

    // Employment type filter
    if (employmentType) {
        where.employmentType = employmentType;
    }

    // Salary filters
    if (minSalary) {
        where.salaryMax = { gte: parseInt(minSalary) };
    }
    if (maxSalary) {
        where.salaryMin = { lte: parseInt(maxSalary) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
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
                    select: { applications: true }
                }
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: parseInt(limit)
        }),
        prisma.job.count({ where })
    ]);

    res.json({
        jobs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
}));

/**
 * @route   GET /api/jobs/applications
 * @desc    Get all applications for recruiter's jobs
 */
router.get('/applications', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const applications = await prisma.application.findMany({
        where: { job: { recruiterId: req.user.id } },
        include: {
            candidate: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
            job: { select: { id: true, title: true, company: true } },
            resume: { select: { id: true, title: true, atsScore: true, fileUrl: true } }
        },
        orderBy: { appliedAt: 'desc' }
    });

    res.json({ applications });
}));

/**
 * @route   GET /api/jobs/my-applications
 * @desc    Get all applications for the current candidate
 */
router.get('/my-applications', authenticate, asyncHandler(async (req, res) => {
    if (req.user.role !== 'CANDIDATE') {
        throw new AppError('Only candidates can view their applications', 403);
    }

    const applications = await prisma.application.findMany({
        where: { candidateId: req.user.id },
        include: {
            job: { select: { id: true, title: true, company: true, companyLogo: true, location: true, workType: true, recruiterId: true } },
            interviews: true
        },
        orderBy: { appliedAt: 'desc' }
    });

    res.json({ applications });
}));

/**
 * @route   PATCH /api/jobs/applications/:id
 * @desc    Update application status
 */
router.patch('/applications/:id', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const { status } = req.body;

    // Verify it belongs to one of recruiter's jobs
    const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
            job: true,
            candidate: true
        }
    });

    if (!application || application.job.recruiterId !== req.user.id) {
        throw new AppError('Application not found or unauthorized', 404);
    }

    const updatedApplication = await prisma.application.update({
        where: { id: req.params.id },
        data: { status }
    });

    // Send email notification about status change
    try {
        if (status !== 'PENDING' && status !== application.status) {
            await emailService.sendApplicationStatusEmail(updatedApplication, application.candidate, application.job);

            // Send in-app notification
            await createNotification(
                application.candidate.id,
                'APPLICATION',
                'Application Status Updated',
                `Your application for ${application.job.title} at ${application.job.company} is now ${status}.`,
                { applicationId: updatedApplication.id, jobId: application.job.id, status }
            );
        }
    } catch (emailError) {
        console.error('Failed to send status update email/notification:', emailError);
        // Don't throw error to allow application status to be updated even if email fails
    }

    res.json({ message: 'Application updated', application: updatedApplication });
}));

/**
 * @route   GET /api/jobs/my-jobs
 * @desc    Get current recruiter's jobs
 */
router.get('/my-jobs', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const jobs = await prisma.job.findMany({
        where: { recruiterId: req.user.id },
        include: {
            skills: {
                include: { skill: true }
            },
            _count: {
                select: { applications: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ jobs });
}));

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Apply to a job
 */
router.post('/:id/apply', authenticate, asyncHandler(async (req, res) => {
    if (req.user.role !== 'CANDIDATE') {
        throw new AppError('Only candidates can apply to jobs', 403);
    }

    const { resumeId, coverLetter, matchScore } = req.body;

    if (!resumeId) {
        throw new AppError('Resume ID is required', 400);
    }

    // Check if already applied
    const existing = await prisma.application.findUnique({
        where: {
            candidateId_jobId: {
                candidateId: req.user.id,
                jobId: req.params.id
            }
        }
    });

    if (existing) {
        throw new AppError('Already applied to this job', 400);
    }

    // Fetch Resume and Job for AI Matching
    const resume = await prisma.resume.findUnique({
        where: { id: resumeId, userId: req.user.id }
    });

    if (!resume) {
        throw new AppError('Resume not found or unauthorized', 404);
    }

    const jobToApply = await prisma.job.findUnique({
        where: { id: req.params.id }
    });

    if (!jobToApply) {
        throw new AppError('Job not found', 404);
    }

    // Evaluate Match with AI
    const analysis = await evaluateResumeMatch(
        resume.rawText || 'No text content available',
        jobToApply.description,
        jobToApply.requirements
    );

    const application = await prisma.application.create({
        data: {
            candidateId: req.user.id,
            jobId: req.params.id,
            resumeId,
            coverLetter,
            matchScore: analysis.matchScore,
            matchAnalysis: analysis
        }
    });

    // Notify recruiter
    await createNotification(
        jobToApply.recruiterId,
        'APPLICATION',
        'New Job Application',
        `A candidate has applied for your job: ${jobToApply.title}.`,
        { applicationId: application.id, jobId: jobToApply.id, candidateId: req.user.id }
    );

    // Increment application count on job
    await prisma.job.update({
        where: { id: req.params.id },
        data: { applicationCount: { increment: 1 } }
    });

    res.status(201).json({ message: 'Applied successfully', application });
}));

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job details
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
            recruiter: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    linkedinUrl: true
                }
            },
            skills: {
                include: { skill: true }
            },
            _count: {
                select: { applications: true }
            }
        }
    });

    if (!job) {
        throw new AppError('Job not found', 404);
    }

    // Increment view count
    await prisma.job.update({
        where: { id: req.params.id },
        data: { viewCount: { increment: 1 } }
    });

    // Check if current user has applied (if authenticated)
    let hasApplied = false;
    if (req.user && req.user.role === 'CANDIDATE') {
        const application = await prisma.application.findUnique({
            where: {
                candidateId_jobId: {
                    candidateId: req.user.id,
                    jobId: job.id
                }
            }
        });
        hasApplied = !!application;
    }

    res.json({ job, hasApplied });
}));

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job posting
 */
router.put('/:id', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const job = await prisma.job.findFirst({
        where: {
            id: req.params.id,
            recruiterId: req.user.id
        }
    });

    if (!job) {
        throw new AppError('Job not found or unauthorized', 404);
    }

    const {
        title,
        company,
        companyLogo,
        description,
        requirements,
        location,
        workType,
        employmentType,
        salaryMin,
        salaryMax,
        salaryCurrency,
        isActive,
        expiresAt
    } = req.body;

    const updatedJob = await prisma.job.update({
        where: { id: req.params.id },
        data: {
            title,
            company,
            companyLogo,
            description,
            requirements,
            location,
            workType,
            employmentType,
            salaryMin: salaryMin ? parseInt(salaryMin) : null,
            salaryMax: salaryMax ? parseInt(salaryMax) : null,
            salaryCurrency,
            isActive,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        }
    });

    res.json({ message: 'Job updated', job: updatedJob });
}));

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job posting
 */
router.delete('/:id', authenticate, isRecruiterOrAdmin, asyncHandler(async (req, res) => {
    const job = await prisma.job.findFirst({
        where: {
            id: req.params.id,
            ...(req.user.role !== 'ADMIN' && { recruiterId: req.user.id })
        }
    });

    if (!job) {
        throw new AppError('Job not found or unauthorized', 404);
    }

    await prisma.job.delete({
        where: { id: req.params.id }
    });

    res.json({ message: 'Job deleted successfully' });
}));

/**
 * @route   POST /api/jobs/:id/toggle-active
 * @desc    Toggle job active status
 */
router.post('/:id/toggle-active', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const job = await prisma.job.findFirst({
        where: {
            id: req.params.id,
            recruiterId: req.user.id
        }
    });

    if (!job) {
        throw new AppError('Job not found or unauthorized', 404);
    }

    const updatedJob = await prisma.job.update({
        where: { id: req.params.id },
        data: { isActive: !job.isActive }
    });

    res.json({
        message: `Job ${updatedJob.isActive ? 'activated' : 'deactivated'}`,
        isActive: updatedJob.isActive
    });
}));

export default router;
