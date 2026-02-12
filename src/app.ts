import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// CORS Configuration - CRITICAL!
app.use(cors({
  origin: [
    'https://krishi-sathi-frontend.vercel.app',
    'https://krishi-sathi-frontend-9icqx9soz-devanshs-projects-b9c496ea.vercel.app',
    /^https:\/\/krishi-sathi-frontend-.*\.vercel\.app$/,  // All preview deployments
    /^https:\/\/.*-devanshs-projects-b9c496ea\.vercel\.app$/  // Your specific Vercel pattern
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight for 10 minutes
}));

// Handle preflight requests
app.options('*', cors());

// Other middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Krishi Sathi API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Import routes
import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import userRoutes from './routes/userRoutes';

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/users', userRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

export default app;
