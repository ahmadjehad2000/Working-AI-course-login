import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import route handlers
import authRoutes from './routes/auth';
import coursesRoutes from './routes/courses';
import modulesRoutes from './routes/modules';
import enrollmentsRoutes from './routes/enrollments';
import quizzesRoutes from './routes/quizzes';
import certificatesRoutes from './routes/certificates';
import usersRoutes from './routes/users';
import aiRoutes from './routes/ai';

// Import middleware
import { optionalAuth } from './middleware/auth';

// Import Swagger setup
import { setupSwagger } from './config/swagger';

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: process.env.NODE_ENV === 'development' 
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] 
          : ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  }));

  app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // Auth rate limiting (stricter)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.'
    },
    skipSuccessfulRequests: true,
  });

  app.use('/api/auth/', authLimiter);

  // Optional authentication middleware for public routes
  app.use('/api/', optionalAuth);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api', modulesRoutes); // Uses /api/courses/:courseId/modules
  app.use('/api/enrollments', enrollmentsRoutes);
  app.use('/api', quizzesRoutes); // Uses /api/modules/:moduleId/quizzes
  app.use('/api/certificates', certificatesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api', aiRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Setup Swagger documentation
  setupSwagger(app);

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
