import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createQuiz, submitQuiz } from '../controllers/quizController.js';

const router = express.Router();

router.post('/generate', authenticate, createQuiz);
router.post('/submit', authenticate, submitQuiz);

export default router;
