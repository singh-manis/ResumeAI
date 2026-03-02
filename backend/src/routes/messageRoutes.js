import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getConversations,
    getConversationMessages,
    startConversation,
    sendMessage
} from '../controllers/messageController.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticate);

// Get list of all conversations for the logged in user
router.get('/conversations', getConversations);

// Initialize a conversation with a specific user
router.post('/start', startConversation);

// Get messages for a specific conversation
router.get('/:conversationId/messages', getConversationMessages);

// Send a message to a specific conversation
router.post('/:conversationId/messages', sendMessage);

export default router;
