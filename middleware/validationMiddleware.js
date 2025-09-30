// middleware/validationMiddleware.js
const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Order creation validation (PhonePe)
const validateOrderCreation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('items.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  
  body('items.*.title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product title cannot be empty'),
  
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be 2-50 characters'),

  body('shippingAddress.lastName')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be 2-50 characters'),

  body('shippingAddress.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('shippingAddress.phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number is required (10 digits starting with 6-9)'),

  body('shippingAddress.address')
    .trim()
    .notEmpty()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be 5-200 characters'),

  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be 2-50 characters'),

  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be 2-50 characters'),

  body('shippingAddress.zipCode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Valid Indian PIN code is required'),

  body('shippingMethod')
    .optional()
    .isIn(['standard', 'express'])
    .withMessage('Shipping method must be standard or express'),

  body('amount')
    .optional()
    .isInt({ min: 100 })
    .withMessage('Amount must be at least 100 paise'),

  handleValidationErrors
];

// PhonePe callback validation
const validatePhonePeCallback = [
  body('response')
    .notEmpty()
    .withMessage('PhonePe response is required')
    .isBase64()
    .withMessage('Response must be base64 encoded'),

  body('checksum')
    .notEmpty()
    .withMessage('PhonePe checksum is required')
    .matches(/^[a-f0-9]{64}###\d+$/)
    .withMessage('Invalid checksum format'),

  handleValidationErrors
];

// Transaction ID validation
const validateTransactionId = [
  param('transactionId')
    .matches(/^TXN-\d+-\d{4}$/)
    .withMessage('Invalid transaction ID format'),
  
  handleValidationErrors
];

// Refund validation (PhonePe)
const validateRefund = [
  param('transactionId')
    .matches(/^TXN-\d+-\d{4}$/)
    .withMessage('Invalid transaction ID format'),

  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Refund amount must be positive'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters'),

  handleValidationErrors
];

// Order ID validation
const validateOrderId = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  handleValidationErrors
];

// Order number validation
const validateOrderNumber = [
  param('orderNumber')
    .matches(/^ORD-\d{8}-[A-Z0-9]{4}$/)
    .withMessage('Invalid order number format'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded', 'all'])
    .withMessage('Invalid status filter'),

  handleValidationErrors
];

// Payment status check validation
const validateStatusCheck = [
  param('transactionId')
    .matches(/^TXN-\d+-\d{4}$/)
    .withMessage('Invalid transaction ID format'),
  
  handleValidationErrors
];

// Order cancellation validation
const validateOrderCancellation = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Cancellation reason must not exceed 200 characters'),

  handleValidationErrors
];

// Status update validation (Admin)
const validateStatusUpdate = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),

  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),

  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be 5-50 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  handleValidationErrors
];

// Admin payment status update validation
const validateAdminPaymentUpdate = [
  param('transactionId')
    .matches(/^TXN-\d+-\d{4}$/)
    .withMessage('Invalid transaction ID format'),

  body('status')
    .isIn(['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'])
    .withMessage('Invalid payment status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

  handleValidationErrors
];

// Date range validation for admin reports
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  handleValidationErrors
];

module.exports = {
  validateOrderCreation,
  validatePhonePeCallback,
  validateTransactionId,
  validateRefund,
  validateOrderId,
  validateOrderNumber,
  validatePagination,
  validateStatusCheck,
  validateOrderCancellation,
  validateStatusUpdate,
  validateAdminPaymentUpdate,
  validateDateRange,
  handleValidationErrors
};