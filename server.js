const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import files
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/payment');

// Create Express app
const app = express();

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());

// Rate limiting - General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min
  message: 'Too many requests from this IP, please try again later.'
});

// Rate limiting - Payment routes (strict)
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many payment requests, please try again later.'
});

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// CORS
app.use(cors({
  origin: ['https://beinfinity.in', 'https://www.beinfinity.in'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes); // Apply strict rate limiting
app.use('/api/orders', require('./routes/orders'));
app.use('/api/profile', require('./routes/profileRoutes')); 

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Be Infinity API is running!',
    environment: process.env.NODE_ENV 
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});