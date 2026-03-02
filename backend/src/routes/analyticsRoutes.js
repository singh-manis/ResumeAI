import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isCandidate, isRecruiter, isAdmin } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';

const router = express.Router();

/**
 * @route   GET /api/analytics/candidate
 * @desc    Get analytics for candidate
 */
router.get('/candidate', authenticate, isCandidate, asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get resume stats
    const resumeStats = await prisma.resume.aggregate({
        where: { userId },
        _count: true,
        _avg: { atsScore: true }
    });

    // Get application stats
    const applications = await prisma.application.findMany({
        where: { candidateId: userId },
        select: { status: true }
    });

    const applicationStats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        reviewed: applications.filter(a => a.status === 'REVIEWED').length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        interview: applications.filter(a => a.status === 'INTERVIEW').length,
        offered: applications.filter(a => a.status === 'OFFERED').length,
        rejected: applications.filter(a => a.status === 'REJECTED').length
    };

    // Get match stats
    const matchStats = await prisma.match.aggregate({
        where: { resume: { userId } },
        _count: true,
        _avg: { overallScore: true },
        _max: { overallScore: true }
    });

    // Get recent activity
    const recentApplications = await prisma.application.findMany({
        where: { candidateId: userId },
        include: {
            job: {
                select: { title: true, company: true }
            }
        },
        orderBy: { appliedAt: 'desc' },
        take: 5
    });

    // Applications over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationsOverTime = await prisma.application.groupBy({
        by: ['appliedAt'],
        where: {
            candidateId: userId,
            appliedAt: { gte: thirtyDaysAgo }
        },
        _count: true
    });

    res.json({
        resumeStats: {
            count: resumeStats._count,
            avgAtsScore: Math.round(resumeStats._avg.atsScore || 0)
        },
        applicationStats,
        matchStats: {
            count: matchStats._count,
            avgScore: Math.round(matchStats._avg.overallScore || 0),
            bestScore: Math.round(matchStats._max.overallScore || 0)
        },
        recentApplications,
        applicationsOverTime
    });
}));

/**
 * @route   GET /api/analytics/recruiter
 * @desc    Get analytics for recruiter
 */
router.get('/recruiter', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Job stats
    const jobStats = await prisma.job.aggregate({
        where: { recruiterId: userId },
        _count: true,
        _sum: { viewCount: true, applicationCount: true }
    });

    const activeJobs = await prisma.job.count({
        where: { recruiterId: userId, isActive: true }
    });

    // Get all applications for recruiter's jobs
    const applications = await prisma.application.findMany({
        where: { job: { recruiterId: userId } },
        select: { status: true }
    });

    const applicationStats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        reviewed: applications.filter(a => a.status === 'REVIEWED').length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        interview: applications.filter(a => a.status === 'INTERVIEW').length,
        offered: applications.filter(a => a.status === 'OFFERED').length
    };

    // Top performing jobs
    const topJobs = await prisma.job.findMany({
        where: { recruiterId: userId },
        orderBy: { applicationCount: 'desc' },
        take: 5,
        select: {
            id: true,
            title: true,
            company: true,
            viewCount: true,
            applicationCount: true,
            isActive: true
        }
    });

    // Recent applications
    const recentApplications = await prisma.application.findMany({
        where: { job: { recruiterId: userId } },
        include: {
            candidate: {
                select: { firstName: true, lastName: true, email: true }
            },
            job: {
                select: { title: true }
            }
        },
        orderBy: { appliedAt: 'desc' },
        take: 10
    });

    res.json({
        jobStats: {
            total: jobStats._count,
            active: activeJobs,
            totalViews: jobStats._sum.viewCount || 0,
            totalApplications: jobStats._sum.applicationCount || 0
        },
        applicationStats,
        topJobs,
        recentApplications
    });
}));

/**
 * @route   GET /api/analytics/admin
 * @desc    Get platform-wide analytics (admin only)
 */
router.get('/admin', authenticate, isAdmin, asyncHandler(async (req, res) => {
    const period = req.query.period || 'week';

    // Calculate date ranges based on period
    const now = new Date();
    let startDate, previousStartDate, previousEndDate;

    if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
    } else if (period === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
    } else {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
    }

    // User stats by role
    const userStats = await prisma.user.groupBy({
        by: ['role'],
        _count: true
    });

    const totalUsers = await prisma.user.count();

    // Platform stats
    const [
        totalResumes,
        totalJobs,
        totalApplications,
        activeJobs
    ] = await Promise.all([
        prisma.resume.count(),
        prisma.job.count(),
        prisma.application.count(),
        prisma.job.count({ where: { isActive: true } })
    ]);

    // Growth stats (current period vs previous period)
    const [currentUsers, previousUsers] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: startDate } } }),
        prisma.user.count({ where: { createdAt: { gte: previousStartDate, lt: previousEndDate } } })
    ]);

    const [currentResumes, previousResumes] = await Promise.all([
        prisma.resume.count({ where: { createdAt: { gte: startDate } } }),
        prisma.resume.count({ where: { createdAt: { gte: previousStartDate, lt: previousEndDate } } })
    ]);

    const [currentJobs, previousJobs] = await Promise.all([
        prisma.job.count({ where: { createdAt: { gte: startDate } } }),
        prisma.job.count({ where: { createdAt: { gte: previousStartDate, lt: previousEndDate } } })
    ]);

    const [currentApplications, previousApplications] = await Promise.all([
        prisma.application.count({ where: { appliedAt: { gte: startDate } } }),
        prisma.application.count({ where: { appliedAt: { gte: previousStartDate, lt: previousEndDate } } })
    ]);

    // Calculate growth percentages
    const calcGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    // Activity data by day
    const activityData = [];
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = days - 1; i >= 0; i--) {
        let dayStart, dayEnd, label;

        if (period === 'year') {
            // Monthly data for year view
            dayStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            dayEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            label = monthLabels[dayStart.getMonth()];
        } else {
            dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            dayStart.setHours(0, 0, 0, 0);
            dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            label = period === 'week' ? dayLabels[dayStart.getDay()] : `${dayStart.getMonth() + 1}/${dayStart.getDate()}`;
        }

        const [users, resumes, applications] = await Promise.all([
            prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
            prisma.resume.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
            prisma.application.count({ where: { appliedAt: { gte: dayStart, lt: dayEnd } } })
        ]);

        activityData.push({ date: label, users, resumes, applications });
    }

    // Top skills from job requirements
    const topSkillsRaw = await prisma.jobSkill.groupBy({
        by: ['skillId'],
        _count: { skillId: true },
        orderBy: { _count: { skillId: 'desc' } },
        take: 5
    });

    const skillIds = topSkillsRaw.map(s => s.skillId);
    const skills = skillIds.length > 0
        ? await prisma.skill.findMany({ where: { id: { in: skillIds } } })
        : [];

    const topSkills = topSkillsRaw.map(s => {
        const skill = skills.find(sk => sk.id === s.skillId);
        return { name: skill?.name || 'Unknown', count: s._count.skillId };
    });

    // Recent activity
    const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { firstName: true, lastName: true, createdAt: true, role: true }
    });

    const recentResumes = await prisma.resume.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { user: { select: { firstName: true, lastName: true } } }
    });

    const recentJobs = await prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { company: true, title: true, createdAt: true }
    });

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds} sec ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const recentActivity = [
        ...recentUsers.map(u => ({
            type: 'signup',
            user: `${u.firstName} ${u.lastName}`,
            time: formatTimeAgo(u.createdAt)
        })),
        ...recentResumes.map(r => ({
            type: 'resume',
            user: `${r.user.firstName} ${r.user.lastName}`,
            time: formatTimeAgo(r.createdAt)
        })),
        ...recentJobs.map(j => ({
            type: 'job',
            user: j.company,
            time: formatTimeAgo(j.createdAt)
        }))
    ].sort((a, b) => {
        // Sort by time (this is a rough sort based on the time string)
        const getSeconds = (t) => {
            if (t.includes('sec')) return parseInt(t);
            if (t.includes('min')) return parseInt(t) * 60;
            if (t.includes('hour')) return parseInt(t) * 3600;
            return parseInt(t) * 86400;
        };
        return getSeconds(a.time) - getSeconds(b.time);
    }).slice(0, 5);

    res.json({
        overview: {
            totalUsers,
            userGrowth: calcGrowth(currentUsers, previousUsers),
            totalResumes,
            resumeGrowth: calcGrowth(currentResumes, previousResumes),
            totalJobs,
            jobGrowth: calcGrowth(currentJobs, previousJobs),
            totalApplications,
            applicationGrowth: calcGrowth(currentApplications, previousApplications)
        },
        usersByRole: userStats.reduce((acc, stat) => {
            acc[stat.role] = stat._count;
            return acc;
        }, {}),
        activityData,
        topSkills,
        recentActivity
    });
}));

/**
 * @route   GET /api/analytics/skills-demand
 * @desc    Get top skills in demand
 */
router.get('/skills-demand', authenticate, asyncHandler(async (req, res) => {
    // Get skills with most job requirements
    const skillDemand = await prisma.jobSkill.groupBy({
        by: ['skillId'],
        _count: true,
        orderBy: { _count: { skillId: 'desc' } },
        take: 20
    });

    const skillIds = skillDemand.map(s => s.skillId);
    const skills = await prisma.skill.findMany({
        where: { id: { in: skillIds } }
    });

    const result = skillDemand.map(sd => {
        const skill = skills.find(s => s.id === sd.skillId);
        return {
            name: skill?.name || 'Unknown',
            category: skill?.category,
            demand: sd._count
        };
    });

    res.json({ topSkills: result });
}));

export default router;
