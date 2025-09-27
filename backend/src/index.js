import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import socialAccountsRoutes from './routes/socialAccounts.js';
import chatRoutes from './routes/chat.js';
import scraperRoutes from './routes/scraper.js';
import instagramRoutes from './routes/instagram.js';
import instagramAuthRoutes from './routes/instagramAuth.js';
import billingRoutes from './routes/billing.js';
import analyticsRoutes from './routes/analytics.js';
import publishPosts from './services/publisher.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Production environment configuration
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
const allowedOrigins = isProduction 
  ? [process.env.CLIENT_URL].filter(Boolean) // Only production domain in production
  : [
      process.env.CLIENT_URL || 'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081'
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser tools (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, be more permissive
      if (!isProduction && origin?.includes('localhost')) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Handle preflight for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/social-accounts', socialAccountsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/instagram-auth', instagramAuthRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics', analyticsRoutes);

// (Instagram OAuth routes are handled in routes/instagram.js)

// Cron job for auto-publishing (runs every minute)
cron.schedule('* * * * *', async () => {
  console.log('Running publisher cron job...');
  await publishPosts(prisma);
});

// Enhanced health check for production
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: 'connected',
      services: {
        instagram: !!process.env.FACEBOOK_APP_ID,
        cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
        email: !!process.env.SMTP_HOST,
        stripe: !!process.env.STRIPE_SECRET_KEY
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Ready check for Kubernetes/Docker
app.get('/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for ${process.env.CLIENT_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Instagram routes: http://localhost:${PORT}/api/instagram/health`);
});