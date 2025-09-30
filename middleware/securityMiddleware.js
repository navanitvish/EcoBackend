// middleware/securityMiddleware.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful verifications
    return req.user && req.method === 'GET';
  }
});

// Rate limiting for order creation
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 orders per window
  message: {
    success: false,
    message: 'Too many order creation attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.razorpay.com"],
      frameSrc: ["https://api.razorpay.com"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow Razorpay iframe
});

// Sanitize data against NoSQL injection
const sanitizeData = [
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key: ${key} in ${req.path}`);
    }
  }),
  xss() // Clean user input from malicious HTML
];

// Prevent HTTP Parameter Pollution
const preventHPP = hpp({
  whitelist: ['status', 'page', 'limit'] // Allow these parameters to be arrays
});

// CORS middleware for frontend integration
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    };
    
    // Log payment-related requests with more detail
    if (req.url.includes('/payment') || req.url.includes('/order')) {
      console.log('PAYMENT/ORDER REQUEST:', JSON.stringify(logData, null, 2));
    }
  });
  
  next();
};

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  console.error('Security middleware error:', error);

  // Handle specific error types
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body too large'
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

// IP whitelist for webhook endpoints (optional)
const webhookIPWhitelist = (req, res, next) => {
  const razorpayIPs = [
    '52.66.93.186',
    '52.66.148.246',
    '52.66.198.120',
    '13.232.206.126'
    // Add more Razorpay webhook IPs as needed
  ];

  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Skip IP check in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!razorpayIPs.includes(clientIP)) {
    console.warn(`Unauthorized webhook access attempt from IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access'
    });
  }

  next();
};

// Validate request size
const requestSizeLimit = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.headers['content-length']);

  if (contentLength && contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request too large'
    });
  }

  next();
};

module.exports = {
  paymentLimiter,
  orderLimiter,
  generalLimiter,
  securityHeaders,
  sanitizeData,
  preventHPP,
  corsMiddleware,
  requestLogger,
  errorHandler,
  webhookIPWhitelist,
  requestSizeLimit
};