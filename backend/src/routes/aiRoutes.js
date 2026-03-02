import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateContent } from '../services/aiService.js';

const router = express.Router();

router.post('/enhance', authenticate, async (req, res) => {
    try {
        const { text, type } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Text is required' });
        }

        let prompt = '';
        if (type === 'summary') {
            prompt = `Rewrite the following professional summary to be more impactful, concise, and results-oriented. Keep it under 4 sentences. \n\nOriginal: ${text}`;
        } else if (type === 'experience') {
            prompt = `Rewrite the following job description bullet point to use strong action verbs and quantify results where possible. \n\nOriginal: ${text}`;
        } else {
            prompt = `Improve the following text for a professional resume: ${text}`;
        }

        const enhancedText = await generateContent(prompt);
        res.json({ enhancedText });
    } catch (error) {
        console.error('AI Enhance error:', error);
        res.status(500).json({ message: 'Failed to enhance text' });
    }
});

export default router;
