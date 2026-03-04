import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isRecruiter } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
    startInterview,
    processInterviewChat,
    streamStartInterview,
    streamProcessInterviewChat,
    getInterviews,
    scheduleInterview,
    updateInterview,
    deleteInterview
} from '../controllers/interviewController.js';

const router = express.Router();

// AI Interview Routes (Existing)
router.post('/start', authenticate, startInterview);
router.post('/chat', authenticate, processInterviewChat);

// AI Interview Routes (Streaming)
router.post('/stream-start', authenticate, streamStartInterview);
router.post('/stream-chat', authenticate, streamProcessInterviewChat);

// Human Interview Routes
router.get('/', authenticate, asyncHandler(getInterviews));
router.post('/', authenticate, isRecruiter, asyncHandler(scheduleInterview));
router.patch('/:id', authenticate, asyncHandler(updateInterview));
router.delete('/:id', authenticate, asyncHandler(deleteInterview));

export default router;
