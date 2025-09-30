// middleware/paymentMiddleware.js
// Middleware for PhonePe payment operations

// Helper functions for validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  // Indian phone number validation (10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(String(phone).replace(/\D/g, ''));
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Clean up rate limit store every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 3600000) { // 1 hour
      rateLimitStore.delete(key);
    }
  }
}, 3600000);

// Validation middleware for payment requests
const validatePaymentRequest = (req, res, next) => {
  console.log('🔍 Validating payment request...');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request path:', req.path);
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  const { body } = req;
  
  if (!body || Object.keys(body).length === 0) {
    console.error('❌ Empty request body');
    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      message: 'Request body cannot be empty'
    });
  }
  
  console.log('✅ Basic request validation passed');
  next();
};

// Validation middleware for creating PhonePe orders
const validateCreateOrder = (req, res, next) => {
  console.log('🔍 Validating create order request...');
  
  const { items, shippingAddress, amount } = req.body;
  const errors = [];
  
  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Order must contain at least one item');
  } else {
    items.forEach((item, index) => {
      if (!item.name && !item.title) {
        errors.push(`Item ${index + 1}: Name is required`);
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (item.price === undefined || typeof item.price !== 'number' || item.price < 0) {
        errors.push(`Item ${index + 1}: Valid price is required`);
      }
    });
  }
  
  // Validate shipping address
  if (!shippingAddress) {
    errors.push('Shipping address is required');
  } else {
    const requiredFields = [
      'firstName', 'lastName', 'email', 
      'phone', 'address', 'city', 'state', 'zipCode'
    ];

    requiredFields.forEach(field => {
      const value = shippingAddress[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        errors.push(`Shipping ${field} is required`);
      }
    });

    // Validate email format
    if (shippingAddress.email && !isValidEmail(String(shippingAddress.email))) {
      errors.push('Invalid email format');
    }
    
    // Validate phone format (Required for PhonePe)
    if (shippingAddress.phone && !isValidPhone(String(shippingAddress.phone))) {
      errors.push('Invalid phone number format. Must be a valid 10-digit Indian number');
    }
    
    // PhonePe requires phone number
    if (!shippingAddress.phone) {
      errors.push('Phone number is required for PhonePe payments');
    }
  }
  
  // Validate amount (optional, can be calculated from items)
  if (amount !== undefined && (typeof amount !== 'number' || amount < 100)) {
    errors.push('Amount must be at least 100 paise (1 rupee)');
  }
  
  if (errors.length > 0) {
    console.error('❌ Create order validation failed:', errors);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please correct the following errors',
      errors: errors
    });
  }
  
  console.log('✅ Create order validation passed');
  next();
};

// Validation middleware for PhonePe callback
const validatePhonePeCallback = (req, res, next) => {
  console.log('🔍 Validating PhonePe callback...');
  
  const { response, checksum } = req.body;
  const errors = [];
  
  if (!response) {
    errors.push('PhonePe response is required');
  }
  
  if (!checksum) {
    errors.push('PhonePe checksum is required');
  }
  
  // Validate checksum format (should be hash###saltIndex)
  if (checksum && !checksum.includes('###')) {
    errors.push('Invalid PhonePe checksum format');
  }
  
  if (errors.length > 0) {
    console.error('❌ PhonePe callback validation failed:', errors);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Invalid PhonePe callback data',
      errors: errors
    });
  }
  
  console.log('✅ PhonePe callback validation passed');
  next();
};

// Check PhonePe configuration
const checkPhonePeConfig = (req, res, next) => {
  console.log('🔧 Checking PhonePe configuration...');
  
  if (!process.env.PHONEPE_MERCHANT_ID || 
      !process.env.PHONEPE_SALT_KEY || 
      !process.env.PHONEPE_SALT_INDEX) {
    console.error('❌ PhonePe configuration missing');
    return res.status(500).json({
      success: false,
      error: 'Configuration error',
      message: 'Payment service is not properly configured'
    });
  }
  
  console.log('✅ PhonePe configuration found');
  next();
};

// Log payment requests
const logPaymentRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  console.log(`📝 [${timestamp}] Payment Request: ${req.method} ${req.path}`);
  console.log(`   IP: ${ip}`);
  console.log(`   User-Agent: ${userAgent}`);
  
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 [${timestamp}] Response: ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
};

// Rate limiting for payments
const rateLimitPayments = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; 
  const maxRequests = 10;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const data = rateLimitStore.get(ip);
  
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + windowMs;
    return next();
  }
  
  if (data.count >= maxRequests) {
    console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many payment requests. Please try again later.',
      retryAfter: Math.ceil((data.resetTime - now) / 1000)
    });
  }
  
  data.count++;
  next();
};

// Sanitize payment data
const sanitizePaymentData = (req, res, next) => {
  console.log('🧹 Sanitizing payment data...');
  
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim();
  };
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };
  
  req.body = sanitizeObject(req.body);
  console.log('✅ Payment data sanitized');
  next();
};

// Add security headers
const addSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
};

// Handle payment errors
const handlePaymentError = (error, req, res, next) => {
  console.error('💥 Payment error occurred:', error);
  console.error('Error stack:', error.stack);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  console.error('Request body:', JSON.stringify(req.body, null, 2));
  
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'PhonePeError') {
    statusCode = 400;
    errorMessage = 'Payment service error';
    errorCode = 'PAYMENT_SERVICE_ERROR';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorMessage = 'Payment service unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  } else if (error.response?.status === 401) {
    statusCode = 401;
    errorMessage = 'Payment authentication failed';
    errorCode = 'AUTH_ERROR';
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    error: errorCode,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { details: error.message, stack: error.stack })
  };
  
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  validatePaymentRequest,
  validateCreateOrder,
  validatePhonePeCallback,
  checkPhonePeConfig,
  logPaymentRequest,
  rateLimitPayments,
  sanitizePaymentData,
  addSecurityHeaders,
  handlePaymentError
};