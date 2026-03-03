import { prisma } from '../index.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification } from '../routes/notificationRoutes.js';

// Get all conversations for the current user
export const getConversations = async (req, res) => {
    const userId = req.user.id;
    const isCandidate = req.user.role === 'CANDIDATE';

    try {
        const conversations = await prisma.conversation.findMany({
            where: isCandidate ? { candidateId: userId } : { recruiterId: userId },
            include: {
                candidate: {
                    select: { id: true, firstName: true, lastName: true, avatar: true, email: true }
                },
                recruiter: {
                    select: { id: true, firstName: true, lastName: true, avatar: true, email: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Format response to easily identify the "other" participant
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = isCandidate ? conv.recruiter : conv.candidate;
            const lastMessage = conv.messages[0] || null;
            const unreadCount = 0; // Will be implemented with notifications/message read status

            return {
                id: conv.id,
                jobId: conv.jobId,
                participant: otherParticipant,
                lastMessage,
                unreadCount,
                updatedAt: conv.updatedAt
            };
        });

        res.json({
            status: 'success',
            data: { conversations: formattedConversations }
        });
    } catch (error) {
        throw new AppError('Failed to fetch conversations', 500);
    }
};

// Get a specific conversation with all messages
export const getConversationMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    try {
        // First verify user is part of this conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                candidate: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                recruiter: { select: { id: true, firstName: true, lastName: true, avatar: true } }
            }
        });

        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        if (conversation.candidateId !== userId && conversation.recruiterId !== userId) {
            throw new AppError('Unauthorized to view this conversation', 403);
        }

        // Fetch messages
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        });

        // Mark messages as read if the current user is not the sender
        const unreadMessages = messages.filter(m => !m.isRead && m.senderId !== userId);
        if (unreadMessages.length > 0) {
            await prisma.message.updateMany({
                where: {
                    id: { in: unreadMessages.map(m => m.id) }
                },
                data: { isRead: true }
            });
        }

        const isCandidate = req.user.role === 'CANDIDATE';
        const participant = isCandidate ? conversation.recruiter : conversation.candidate;

        res.json({
            status: 'success',
            data: {
                conversation: {
                    id: conversation.id,
                    jobId: conversation.jobId,
                    participant
                },
                messages
            }
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Failed to fetch messages', 500);
    }
};

// Start or get a conversation with a specific user
export const startConversation = async (req, res) => {
    const userId = req.user.id;
    const isCandidate = req.user.role === 'CANDIDATE';
    const { otherUserId, jobId } = req.body;

    if (!otherUserId) {
        throw new AppError('Must provide user ID to message', 400);
    }

    try {
        const candidateId = isCandidate ? userId : otherUserId;
        const recruiterId = isCandidate ? otherUserId : userId;

        // Check if conversation already exists
        let conversation = await prisma.conversation.findUnique({
            where: {
                candidateId_recruiterId: {
                    candidateId,
                    recruiterId
                }
            },
            include: {
                candidate: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                recruiter: { select: { id: true, firstName: true, lastName: true, avatar: true } }
            }
        });

        // Create if it doesn't exist
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    candidateId,
                    recruiterId,
                    jobId: jobId || null
                },
                include: {
                    candidate: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    recruiter: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                }
            });
        } else if (jobId && !conversation.jobId) {
            // Update job ID context if newly provided and wasn't there before
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { jobId }
            });
        }

        const participant = isCandidate ? conversation.recruiter : conversation.candidate;

        res.status(200).json({
            status: 'success',
            data: {
                conversation: {
                    id: conversation.id,
                    jobId: conversation.jobId || jobId,
                    participant
                }
            }
        });

    } catch (error) {
        console.error('Error starting conversation:', error);
        throw new AppError('Failed to initialize conversation: ' + error.message, 500);
    }
};

// Send a message via HTTP (socket.io will primarily handle this, but good to have fallback/initial API)
export const sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
        throw new AppError('Message content cannot be empty', 400);
    }

    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        if (conversation.candidateId !== senderId && conversation.recruiterId !== senderId) {
            throw new AppError('Unauthorized to send message in this conversation', 403);
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                content: content.trim()
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        const recipientId = conversation.candidateId === senderId ? conversation.recruiterId : conversation.candidateId;
        const senderUser = await prisma.user.findUnique({ where: { id: senderId } });
        const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : 'Someone';

        await createNotification(
            recipientId,
            'MESSAGE',
            `New Message from ${senderName}`,
            content.length > 50 ? content.substring(0, 50) + '...' : content,
            { conversationId, messageId: message.id }
        );

        res.status(201).json({
            status: 'success',
            data: { message }
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Failed to send message', 500);
    }
};
