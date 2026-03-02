import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import savedJobRoutes from './routes/savedJobRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import passport from './config/passport.js';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Express
const app = express();
const httpServer = createServer(app);

// CORS configuration - allow multiple ports in development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL
].filter(Boolean);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev, restrict in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (very high limit for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 2000, // Much higher limit for dev
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Gzip compression for API responses
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files for uploads
app.use('/uploads', express.static(path.resolve('uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Resume Analyzer API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Socket.io connection logic
    io.on('connection', (socket) => {
      console.log(`📡 Socket connected: ${socket.id}`);

      // User joins a specific conversation room
      socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`👥 Socket ${socket.id} joined conversation ${conversationId}`);
      });

      // User leaves a specific conversation room
      socket.on('leave_conversation', (conversationId) => {
        socket.leave(conversationId);
        console.log(`👋 Socket ${socket.id} left conversation ${conversationId}`);
      });

      // Handle sending messages in real-time
      socket.on('send_message', async (data) => {
        const { conversationId, senderId, content } = data;

        try {
          // Save to database
          const message = await prisma.message.create({
            data: {
              conversationId,
              senderId,
              content
            }
          });

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
          });

          // Broadcast to everyone in the room (including sender to confirm)
          io.to(conversationId).emit('new_message', message);
        } catch (error) {
          console.error("Socket message error:", error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
