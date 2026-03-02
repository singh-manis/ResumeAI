import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isCandidate, isRecruiter } from '../middleware/rbac.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';
import { generateMatchExplanation, chatWithCareerBot } from '../services/aiService.js';

const router = express.Router();

/**
 * Calculate cosine similarity between two arrays
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate skill-based match score
 */
function calculateSkillMatch(resumeSkills, jobSkills) {
    if (!resumeSkills || !jobSkills || jobSkills.length === 0) return 0;

    const resumeSkillNames = resumeSkills.map(s =>
        (s.skill?.name || s).toLowerCase()
    );

    const jobSkillNames = jobSkills.map(s =>
        (s.skill?.name || s).toLowerCase()
    );

    let matchCount = 0;
    let requiredMatches = 0;
    let requiredTotal = 0;

    for (const jobSkill of jobSkills) {
        const skillName = (jobSkill.skill?.name || jobSkill).toLowerCase();
        const isRequired = jobSkill.isRequired !== false;

        if (isRequired) requiredTotal++;

        if (resumeSkillNames.includes(skillName)) {
            matchCount++;
            if (isRequired) requiredMatches++;
        }
    }

    // Weight required skills more heavily
    const requiredScore = requiredTotal > 0 ? (requiredMatches / requiredTotal) * 60 : 30;
    const totalScore = (matchCount / jobSkills.length) * 40;

    return Math.round(requiredScore + totalScore);
}

/**
 * @route   POST /api/match/resume/:resumeId
 * @desc    Match a resume against all active jobs
 */
router.post('/resume/:resumeId', authenticate, isCandidate, asyncHandler(async (req, res) => {
    const { resumeId } = req.params;

    // Get the resume
    const resume = await prisma.resume.findFirst({
        where: {
            id: resumeId,
            userId: req.user.id
        },
        include: {
            skills: { include: { skill: true } }
        }
    });

    if (!resume) {
        throw new AppError('Resume not found', 404);
    }

    // Get all active jobs
    const jobs = await prisma.job.findMany({
        where: { isActive: true },
        include: {
            skills: { include: { skill: true } },
            recruiter: {
                select: { firstName: true, lastName: true }
            }
        }
    });

    const matches = [];

    for (const job of jobs) {
        // Calculate skill match
        const skillMatchScore = calculateSkillMatch(
            resume.skills,
            job.skills
        );

        // Calculate text similarity if embeddings exist
        let semanticScore = 0;
        if (resume.embedding && job.embedding) {
            semanticScore = Math.round(cosineSimilarity(
                resume.embedding,
                job.embedding
            ) * 100);
        }

        // Combined score (60% skill match, 40% semantic)
        const overallScore = Math.round(
            skillMatchScore * 0.6 + semanticScore * 0.4
        );

        // Identify skill gaps
        const resumeSkillNames = resume.skills.map(s => s.skill.name.toLowerCase());
        const skillGaps = job.skills
            .filter(js => !resumeSkillNames.includes(js.skill.name.toLowerCase()))
            .map(js => ({
                skill: js.skill.name,
                isRequired: js.isRequired,
                importance: js.importanceLevel
            }));

        // Strong matches
        const strongMatches = job.skills
            .filter(js => resumeSkillNames.includes(js.skill.name.toLowerCase()))
            .map(js => js.skill.name);

        // Create or update match record
        const match = await prisma.match.upsert({
            where: {
                resumeId_jobId: {
                    resumeId: resume.id,
                    jobId: job.id
                }
            },
            update: {
                overallScore,
                skillMatchScore,
                skillGaps,
                strongMatches
            },
            create: {
                resumeId: resume.id,
                jobId: job.id,
                overallScore,
                skillMatchScore,
                skillGaps,
                strongMatches
            }
        });

        matches.push({
            matchId: match.id,
            job: {
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                workType: job.workType,
                employmentType: job.employmentType
            },
            overallScore,
            skillMatchScore,
            semanticScore,
            skillGaps: skillGaps.length,
            strongMatches: strongMatches.length
        });
    }

    // Sort by overall score
    matches.sort((a, b) => b.overallScore - a.overallScore);

    res.json({
        message: 'Matching complete',
        totalJobs: jobs.length,
        matches: matches.slice(0, 20) // Return top 20
    });
}));

/**
 * @route   POST /api/match/job/:jobId
 * @desc    Match a job against all candidate resumes
 */
router.post('/job/:jobId', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    // Get the job
    const job = await prisma.job.findFirst({
        where: {
            id: jobId,
            recruiterId: req.user.id
        },
        include: {
            skills: { include: { skill: true } }
        }
    });

    if (!job) {
        throw new AppError('Job not found', 404);
    }

    // Get all active resumes
    const resumes = await prisma.resume.findMany({
        where: { isActive: true },
        include: {
            skills: { include: { skill: true } },
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true
                }
            }
        }
    });

    const matches = [];

    for (const resume of resumes) {
        const skillMatchScore = calculateSkillMatch(
            resume.skills,
            job.skills
        );

        let semanticScore = 0;
        if (resume.embedding && job.embedding) {
            semanticScore = Math.round(cosineSimilarity(
                resume.embedding,
                job.embedding
            ) * 100);
        }

        const overallScore = Math.round(
            skillMatchScore * 0.6 + semanticScore * 0.4
        );

        const resumeSkillNames = resume.skills.map(s => s.skill.name.toLowerCase());
        const skillGaps = job.skills
            .filter(js => !resumeSkillNames.includes(js.skill.name.toLowerCase()))
            .map(js => ({
                skill: js.skill.name,
                isRequired: js.isRequired
            }));

        const strongMatches = job.skills
            .filter(js => resumeSkillNames.includes(js.skill.name.toLowerCase()))
            .map(js => js.skill.name);

        // Create or update match
        await prisma.match.upsert({
            where: {
                resumeId_jobId: {
                    resumeId: resume.id,
                    jobId: job.id
                }
            },
            update: {
                overallScore,
                skillMatchScore,
                skillGaps,
                strongMatches
            },
            create: {
                resumeId: resume.id,
                jobId: job.id,
                overallScore,
                skillMatchScore,
                skillGaps,
                strongMatches
            }
        });

        matches.push({
            candidate: resume.user,
            resume: {
                id: resume.id,
                title: resume.title,
                atsScore: resume.atsScore
            },
            overallScore,
            skillMatchScore,
            skillGaps: skillGaps.length,
            strongMatches
        });
    }

    matches.sort((a, b) => b.overallScore - a.overallScore);

    res.json({
        message: 'Matching complete',
        totalCandidates: resumes.length,
        matches: matches.slice(0, 20)
    });
}));

/**
 * @route   GET /api/match/results/:resumeId
 * @desc    Get match results for a resume
 */
router.get('/results/:resumeId', authenticate, isCandidate, asyncHandler(async (req, res) => {
    const matches = await prisma.match.findMany({
        where: {
            resumeId: req.params.resumeId,
            resume: { userId: req.user.id }
        },
        include: {
            job: {
                include: {
                    recruiter: {
                        select: { firstName: true, lastName: true }
                    }
                }
            }
        },
        orderBy: { overallScore: 'desc' }
    });

    res.json({ matches });
}));

/**
 * @route   GET /api/match/candidates/:jobId
 * @desc    Get matching candidates for a job
 */
router.get('/candidates/:jobId', authenticate, isRecruiter, asyncHandler(async (req, res) => {
    const matches = await prisma.match.findMany({
        where: {
            jobId: req.params.jobId,
            job: { recruiterId: req.user.id }
        },
        include: {
            resume: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    }
                }
            }
        },
        orderBy: { overallScore: 'desc' }
    });

    res.json({ matches });
}));

/**
 * @route   GET /api/match/detail/:matchId
 * @desc    Get detailed match analysis with AI explanation
 */
router.get('/detail/:matchId', authenticate, asyncHandler(async (req, res) => {
    const match = await prisma.match.findUnique({
        where: { id: req.params.matchId },
        include: {
            resume: {
                include: {
                    user: { select: { id: true } }
                }
            },
            job: {
                include: {
                    recruiter: { select: { id: true } }
                }
            }
        }
    });

    if (!match) {
        throw new AppError('Match not found', 404);
    }

    // Verify access
    const isOwner = match.resume.user.id === req.user.id;
    const isRecruiter = match.job.recruiter.id === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isRecruiter && !isAdmin) {
        throw new AppError('Unauthorized', 403);
    }

    // Generate AI explanation if not present
    if (!match.aiExplanation) {
        try {
            const explanation = await generateMatchExplanation(
                match.resume.parsedData,
                match.job,
                match.overallScore
            );

            await prisma.match.update({
                where: { id: match.id },
                data: { aiExplanation: explanation }
            });

            match.aiExplanation = explanation;
        } catch (error) {
            console.error('Failed to generate explanation:', error);
        }
    }

    res.json({ match });
}));

/**
 * @route   POST /api/match/chat
 * @desc    AI Career Advisor chatbot
 */
router.post('/chat', authenticate, asyncHandler(async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message) {
        throw new AppError('Message is required', 400);
    }

    try {
        const result = await chatWithCareerBot(message, history);
        res.json(result);
    } catch (error) {
        console.error('Chat error:', error);



        // Provide helpful fallback responses based on keywords
        const lowerMessage = message.toLowerCase();
        let fallbackResponse = "";

        if (lowerMessage.includes('resume') || lowerMessage.includes('improve')) {
            fallbackResponse = `Here are some tips to improve your resume:

**1. Tailor for Each Job**
Customize your resume for each position by matching keywords from the job description.

**2. Quantify Achievements**
Use numbers and metrics. Instead of "Improved sales," say "Increased sales by 25% in Q3 2024."

**3. Strong Action Verbs**
Start bullet points with powerful verbs like "Led," "Developed," "Optimized," "Implemented."

**4. Keep it Concise**
Target 1-2 pages. Remove outdated or irrelevant experience.

**5. ATS-Friendly Format**
Use standard fonts, avoid tables/graphics, and include relevant keywords.

Would you like specific advice about any of these areas?`;
        } else if (lowerMessage.includes('interview') || lowerMessage.includes('prepare')) {
            fallbackResponse = `Here are key interview preparation strategies:

**Before the Interview:**
• Research the company thoroughly - mission, products, recent news
• Review common questions for your role
• Prepare 3-5 questions to ask the interviewer
• Practice the STAR method for behavioral questions

**During the Interview:**
• Arrive 10-15 minutes early (or test tech for virtual)
• Listen carefully and take a moment to think before answering
• Be specific with examples from your experience
• Show enthusiasm and genuine interest

**Technical Interviews:**
• Review fundamentals relevant to the role
• Practice coding on paper/whiteboard if applicable
• Explain your thought process as you solve problems

Would you like tips on any specific type of interview?`;
        } else if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
            fallbackResponse = `Here are the most in-demand skills for 2024-2025:

**Technical Skills:**
• AI/Machine Learning - transforming every industry
• Cloud Computing (AWS, Azure, GCP)
• Data Analysis & Visualization
• Cybersecurity
• Full-Stack Development (React, Node.js, Python)

**Soft Skills:**
• Communication & Presentation
• Problem-Solving
• Adaptability & Continuous Learning
• Leadership & Collaboration

**Learning Resources:**
• Coursera, Udemy, LinkedIn Learning for courses
• GitHub for practical projects
• Leetcode/HackerRank for coding practice

Focus on skills that complement your current expertise. What area interests you most?`;
        } else if (lowerMessage.includes('salary') || lowerMessage.includes('negotiate')) {
            fallbackResponse = `Here are effective salary negotiation strategies:

**Research Phase:**
• Use Glassdoor, Levels.fyi, and LinkedIn Salary for benchmarks
• Research industry standards for your role and location
• Know your minimum acceptable number

**Negotiation Tips:**
• Wait until you have an offer before discussing salary
• Let them make the first number
• Focus on total compensation (base + bonus + equity + benefits)
• Be confident but respectful

**What to Say:**
"Based on my research and the value I'll bring, I was expecting something in the range of $X-Y. Is there flexibility?"

Would you like advice specific to your situation?`;
        } else {
            fallbackResponse = `I'm here to help with your career journey! Here are some topics I can assist with:

📝 **Resume Improvement** - Tips to make your resume stand out
🎯 **Job Matching** - Finding roles that fit your skills
📊 **Skill Development** - What to learn for better opportunities
💼 **Interview Prep** - How to ace your interviews
💰 **Salary Negotiation** - Getting the compensation you deserve

What would you like help with today?`;
        }

        res.json({
            response: fallbackResponse,
            suggestions: [
                "How can I improve my resume?",
                "What skills should I learn?",
                "How do I prepare for interviews?"
            ]
        });
    }
}));

export default router;
