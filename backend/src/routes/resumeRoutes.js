import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isCandidate } from '../middleware/rbac.js';
import { uploadResume } from '../middleware/upload.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';
import { parseResume, analyzeResume, calculateATSScore } from '../services/resumeParser.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload and parse a resume
 */
router.post('/upload',
    authenticate,
    isCandidate,
    uploadResume.single('resume'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError('Please upload a resume file', 400);
        }

        const { title } = req.body;
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;

        try {
            // Parse the resume text directly from buffer
            const rawText = await parseResume(fileBuffer, fileName);

            // Upload to Cloudinary
            const cloudinaryResult = await uploadToCloudinary(fileBuffer, 'resumes', 'raw');

            // Create resume record
            const resume = await prisma.resume.create({
                data: {
                    userId: req.user.id,
                    title: title || fileName.replace(/\.[^/.]+$/, ''),
                    originalFileName: fileName,
                    fileUrl: cloudinaryResult.secure_url,
                    rawText
                }
            });

            // Start AI analysis in background (non-blocking)
            analyzeResumeBackground(resume.id, rawText);

            res.status(201).json({
                message: 'Resume uploaded successfully. Analysis in progress.',
                resume: {
                    id: resume.id,
                    title: resume.title,
                    originalFileName: resume.originalFileName,
                    createdAt: resume.createdAt
                }
            });
        } catch (error) {
            console.error('Resume Processing Error:', error);
            throw error;
        }
    })
);

/**
 * Background resume analysis
 */
async function analyzeResumeBackground(resumeId, rawText) {
    try {
        // AI analysis
        const parsedData = await analyzeResume(rawText);

        // Calculate ATS score
        const { score, breakdown, suggestions } = await calculateATSScore(rawText, parsedData);

        // Update resume with analysis results
        await prisma.resume.update({
            where: { id: resumeId },
            data: {
                parsedData,
                atsScore: score,
                atsBreakdown: breakdown,
                aiSuggestions: suggestions
            }
        });

        console.log(`Resume ${resumeId} analysis complete. ATS Score: ${score}`);
    } catch (error) {
        console.error(`Resume ${resumeId} analysis failed:`, error);
    }
}

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for current user
 */
router.get('/', authenticate, isCandidate, asyncHandler(async (req, res) => {
    const resumes = await prisma.resume.findMany({
        where: {
            userId: req.user.id,
            isActive: true
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            originalFileName: true,
            atsScore: true,
            createdAt: true,
            updatedAt: true
        }
    });

    res.json({ resumes });
}));

/**
 * @route   GET /api/resumes/:id
 * @desc    Get resume details
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const resume = await prisma.resume.findFirst({
        where: {
            id: req.params.id,
            userId: req.user.id
        },
        include: {
            skills: {
                include: { skill: true }
            },
            experiences: true,
            educations: true
        }
    });

    if (!resume) {
        throw new AppError('Resume not found', 404);
    }

    res.json({ resume });
}));

/**
 * @route   GET /api/resumes/:id/analysis
 * @desc    Get AI analysis for resume
 */
router.get('/:id/analysis', authenticate, asyncHandler(async (req, res) => {
    const resume = await prisma.resume.findFirst({
        where: {
            id: req.params.id,
            userId: req.user.id
        },
        select: {
            id: true,
            title: true,
            parsedData: true,
            atsScore: true,
            atsBreakdown: true,
            aiSuggestions: true
        }
    });

    if (!resume) {
        throw new AppError('Resume not found', 404);
    }

    if (!resume.parsedData) {
        return res.json({
            resume,
            status: 'processing',
            message: 'Resume analysis is still in progress'
        });
    }

    res.json({ resume, status: 'complete' });
}));

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete a resume
 */
router.delete('/:id', authenticate, isCandidate, asyncHandler(async (req, res) => {
    const resume = await prisma.resume.findFirst({
        where: {
            id: req.params.id,
            userId: req.user.id
        }
    });

    if (!resume) {
        throw new AppError('Resume not found', 404);
    }

    // Delete file
    const filePath = path.join(process.cwd(), resume.fileUrl);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.resume.delete({
        where: { id: req.params.id }
    });

    res.json({ message: 'Resume deleted successfully' });
}));

export default router;
