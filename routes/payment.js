// routes/payment.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const {
  createOrder,
  handlePaymentCallback,
  checkPaymentStatus,
  processRefund,
  getPaymentHistory,
  getPaymentHealth,
  testPhonePeConnection,
  getPhonePeConfig
} = require('../controllers/paymentController');

// ==================== PUBLIC ROUTES ====================

// PhonePe callback handler - No auth (PhonePe calls this)
router.post('/callback', handlePaymentCallback);

// Health check - Public (for monitoring)
router.get('/health', getPaymentHealth);

// Configuration info - Public (safe info only)
router.get('/config', getPhonePeConfig);

// Test PhonePe connection - Public (for debugging)
router.get('/test', testPhonePeConnection);

// ==================== USER PROTECTED ROUTES ====================

// Create PhonePe order - Protected route
router.post('/create-order', authenticateToken, createOrder);

// Check payment status - Protected route
router.get('/status/:transactionId', authenticateToken, checkPaymentStatus);

// Get user's payment history - Protected route
router.get('/history', authenticateToken, getPaymentHistory);

// Process refund - Protected route
router.post('/refund/:transactionId', authenticateToken, processRefund);

// Get specific payment details - Protected route
router.get('/payment/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    console.log(`Fetching payment details for: ${transactionId}`);

    const payment = await Payment.findOne({
      phonepeTransactionId: transactionId,
      userId
    }).populate('orderId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        transactionId: payment.phonepeTransactionId,
        phonepePaymentId: payment.phonepePaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        state: payment.state,
        responseCode: payment.responseCode,
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
        order: payment.orderId,
        refunds: payment.refunds,
        email: payment.email,
        contact: payment.contact
      }
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin: Get all payments with filters
router.get('/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      userId, 
      startDate, 
      endDate,
      search 
    } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { phonepeTransactionId: { $regex: search, $options: 'i' } },
        { phonepePaymentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    console.log(`Admin fetching payments with filters:`, query);

    const payments = await Payment.find(query)
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber total status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      statistics: stats,
      query: {
        status,
        dateRange: { startDate, endDate },
        search
      }
    });

  } catch (error) {
    console.error('Error fetching admin payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Admin: Get payment statistics
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    console.log(`Generating payment statistics...`);

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          refundedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          },
          successfulAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          },
          refundedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] }
          },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    const statusBreakdown = await Payment.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
        break;
      case 'day':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const timeSeriesData = await Payment.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: dateFormat,
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalPayments = stats[0]?.totalPayments || 0;
    const successfulPayments = stats[0]?.successfulPayments || 0;
    const successRate = totalPayments > 0 
      ? ((successfulPayments / totalPayments) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      stats: {
        ...(stats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          successfulPayments: 0,
          failedPayments: 0,
          pendingPayments: 0,
          refundedPayments: 0,
          successfulAmount: 0,
          refundedAmount: 0,
          averageTransaction: 0
        }),
        successRate: parseFloat(successRate),
        netAmount: (stats[0]?.successfulAmount || 0) - (stats[0]?.refundedAmount || 0)
      },
      statusBreakdown,
      timeSeriesData,
      period: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Now',
        groupBy
      }
    });

  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Admin: Get recent transactions
router.get('/admin/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentPayments = await Payment.find()
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber total')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      payments: recentPayments
    });

  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent payments',
      error: error.message
    });
  }
});

// Admin: Update payment status manually
router.patch('/admin/payment/:transactionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, notes, reason } = req.body;

    console.log(`Admin updating payment: ${transactionId} to status: ${status}`);

    const payment = await Payment.findOne({ 
      phonepeTransactionId: transactionId 
    }).populate('orderId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const oldStatus = payment.status;
    payment.status = status;
    
    if (notes || reason) {
      payment.notes = { 
        ...payment.notes, 
        adminNotes: notes || reason,
        adminUpdatedAt: new Date(),
        adminUpdatedBy: req.user.id,
        previousStatus: oldStatus
      };
    }

    await payment.save();

    if (payment.orderId) {
      const Order = require('../models/Order');
      await Order.findByIdAndUpdate(payment.orderId._id, {
        paymentStatus: status,
        status: status === 'paid' ? 'confirmed' : 
               status === 'failed' ? 'cancelled' : 
               payment.orderId.status
      });
    }

    console.log(`Payment status updated: ${oldStatus} to ${status}`);

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment: {
        id: payment._id,
        transactionId: payment.phonepeTransactionId,
        oldStatus,
        newStatus: status,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
});

// Admin: Export payments to CSV
router.get('/admin/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 });

    const csv = [
      ['Date', 'Transaction ID', 'PhonePe ID', 'User', 'Email', 'Order Number', 'Amount', 'Currency', 'Status', 'Payment Date'].join(','),
      ...payments.map(p => [
        new Date(p.createdAt).toISOString(),
        p.phonepeTransactionId,
        p.phonepePaymentId || 'N/A',
        p.userId?.name || 'N/A',
        p.email || 'N/A',
        p.orderId?.orderNumber || 'N/A',
        p.amount,
        p.currency,
        p.status,
        p.paymentDate ? new Date(p.paymentDate).toISOString() : 'N/A'
      ].join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export payments',
      error: error.message
    });
  }
});

// Admin: Retry failed payment
router.post('/admin/retry/:transactionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;

    console.log(`Admin retrying payment: ${transactionId}`);

    const payment = await Payment.findOne({ 
      phonepeTransactionId: transactionId 
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    req.params.transactionId = transactionId;
    return checkPaymentStatus(req, res);

  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment',
      error: error.message
    });
  }
});

module.exports = router;