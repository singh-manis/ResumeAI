import fs from 'fs';

/**
 * Parse resume file to extract text
 */
export async function parseResume(fileBuffer, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
        return parsePDF(fileBuffer);
    } else if (['doc', 'docx'].includes(extension)) {
        return parseDocx(fileBuffer);
    } else {
        throw new Error('Unsupported file format');
    }
}

/**
 * Parse PDF file using pdf-parse v2 (class-based API)
 */
async function parsePDF(dataBuffer) {
    // pdf-parse v2 exports a class `PDFParse`.
    // The buffer is passed via the constructor options: { data: Buffer }
    // Text is then extracted by calling .getText()
    const { PDFParse } = await import('pdf-parse');

    const parser = new PDFParse({
        data: dataBuffer,
        verbosity: 0  // suppress noisy console output
    });

    const result = await parser.getText();
    return result.text;
}

/**
 * Parse DOCX file
 */
async function parseDocx(dataBuffer) {
    // For now, return placeholder - mammoth can be added for DOCX support
    return dataBuffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
}

/**
 * Analyze resume using AI
 * This is a placeholder that will be connected to AI service
 */
export async function analyzeResume(rawText) {
    // Import the AI service dynamically to avoid circular dependencies
    const { analyzeResumeWithAI } = await import('./aiService.js');

    try {
        return await analyzeResumeWithAI(rawText);
    } catch (error) {
        console.error('AI analysis failed:', error);
        // Return basic analysis if AI fails
        return extractBasicInfo(rawText);
    }
}

/**
 * Extract basic info without AI (fallback)
 */
function extractBasicInfo(rawText) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    const emails = rawText.match(emailRegex) || [];
    const phones = rawText.match(phoneRegex) || [];

    // Extract potential skills (common keywords)
    const commonSkills = [
        'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL',
        'HTML', 'CSS', 'Git', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL',
        'TypeScript', 'Angular', 'Vue.js', 'Express', 'Django', 'Flask',
        'Machine Learning', 'Data Science', 'AI', 'Deep Learning'
    ];

    const foundSkills = commonSkills.filter(skill =>
        rawText.toLowerCase().includes(skill.toLowerCase())
    );

    return {
        contact: {
            email: emails[0] || null,
            phone: phones[0] || null
        },
        skills: foundSkills,
        rawAnalysis: {
            wordCount: rawText.split(/\s+/).length,
            hasEducation: /education|university|college|degree|bachelor|master|phd/i.test(rawText),
            hasExperience: /experience|work|job|position|company|employed/i.test(rawText)
        }
    };
}

/**
 * Calculate ATS score
 */
export async function calculateATSScore(rawText, parsedData) {
    const breakdown = {
        format: 0,
        keywords: 0,
        structure: 0,
        length: 0,
        contact: 0
    };

    const suggestions = [];

    // Format score (20 points)
    const wordCount = rawText.split(/\s+/).length;
    if (wordCount >= 300 && wordCount <= 800) {
        breakdown.format = 20;
    } else if (wordCount >= 200 && wordCount <= 1000) {
        breakdown.format = 15;
        suggestions.push('Optimize resume length to 300-800 words for better ATS parsing');
    } else {
        breakdown.format = 10;
        suggestions.push('Resume length should be between 300-800 words');
    }

    // Keywords score (25 points)
    const skillCount = parsedData?.skills?.length || 0;
    if (skillCount >= 10) {
        breakdown.keywords = 25;
    } else if (skillCount >= 5) {
        breakdown.keywords = 20;
    } else if (skillCount >= 3) {
        breakdown.keywords = 15;
    } else {
        breakdown.keywords = 10;
        suggestions.push('Add more relevant skills and keywords to your resume');
    }

    // Structure score (25 points)
    const hasEducation = parsedData?.rawAnalysis?.hasEducation || /education/i.test(rawText);
    const hasExperience = parsedData?.rawAnalysis?.hasExperience || /experience/i.test(rawText);

    if (hasEducation && hasExperience) {
        breakdown.structure = 25;
    } else if (hasEducation || hasExperience) {
        breakdown.structure = 15;
        suggestions.push('Include both education and experience sections');
    } else {
        breakdown.structure = 5;
        suggestions.push('Add clear education and experience sections');
    }

    // Length score (15 points)
    const lines = rawText.split('\n').filter(l => l.trim()).length;
    if (lines >= 20 && lines <= 60) {
        breakdown.length = 15;
    } else {
        breakdown.length = 10;
        suggestions.push('Optimize resume to be 1-2 pages');
    }

    // Contact info score (15 points)
    const hasEmail = parsedData?.contact?.email || /\S+@\S+\.\S+/.test(rawText);
    const hasPhone = parsedData?.contact?.phone || /\d{10}|\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(rawText);

    if (hasEmail && hasPhone) {
        breakdown.contact = 15;
    } else if (hasEmail || hasPhone) {
        breakdown.contact = 10;
        suggestions.push('Include both email and phone number');
    } else {
        breakdown.contact = 5;
        suggestions.push('Add contact information (email and phone)');
    }

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { score, breakdown, suggestions };
}
