import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getGamificationStats } from '../controllers/gamificationController.js';

const router = express.Router();

router.get('/stats', authenticate, getGamificationStats);

export default router;
