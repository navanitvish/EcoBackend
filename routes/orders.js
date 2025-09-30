const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const {
  validateOrderId,
  validateOrderNumber,
  validatePagination,
  validateOrderCancellation,
  validateStatusUpdate
} = require('../middleware/validationMiddleware');
const {
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  cancelOrder,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');

// Get user's orders with pagination and filtering
router.get('/',
  authenticateToken,
  validatePagination,
  getUserOrders
);

// Get order statistics for user
router.get('/stats',
  authenticateToken,
  getOrderStats
);

// Get specific order by ID
router.get('/:orderId',
  authenticateToken,
  validateOrderId,
  getOrderById
);

// Get order by order number
router.get('/number/:orderNumber',
  authenticateToken,
  validateOrderNumber,
  getOrderByNumber
);

// Cancel order
router.patch('/:orderId/cancel',
  authenticateToken,
  validateOrderCancellation,
  cancelOrder
);

// Admin routes for order management
router.get('/admin/all',
  authenticateToken,
  requireAdmin,
  validatePagination,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, userId, search } = req.query;
      
      const query = {};
      if (status && status !== 'all') query.status = status;
      if (userId) query.userId = userId;
      
      // Search by order number or customer email
      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'shippingAddress.email': { $regex: search, $options: 'i' } }
        ];
      }

      const Order = require('../models/Order');
      const orders = await Order.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-razorpaySignature');

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        orders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching admin orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  }
);

// Update order status (Admin only)
router.patch('/admin/:orderId/status',
  authenticateToken,
  requireAdmin,
  validateStatusUpdate,
  updateOrderStatus
);

module.exports = router;