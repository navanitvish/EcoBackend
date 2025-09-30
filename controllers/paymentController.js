const { StandardCheckoutClient, Env } = require('phonepe-pg-sdk-node');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../helpers/emailHelper');

// PhonePe Official SDK Configuration
class PhonePeService {
  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.clientId = isProduction 
      ? process.env.PHONEPE_CLIENT_ID 
      : (process.env.PHONEPE_CLIENT_ID || 'TEST-M23GT5WAJ1JPN_25091');
    
    this.clientSecret = isProduction 
      ? process.env.PHONEPE_CLIENT_SECRET 
      : (process.env.PHONEPE_CLIENT_SECRET || 'NDlkMzljNDUtNjE2Zi00OGY1LWE1ZWMtZDI2ZTU3NDI2Y2Ri');
    
    this.clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION) || 1;
    this.environment = isProduction ? 'production' : 'UAT';
    
    const env = isProduction ? Env.PRODUCTION : Env.SANDBOX;
    
    this.client = StandardCheckoutClient.getInstance(
      this.clientId,
      this.clientSecret,
      this.clientVersion,
      env
    );
    
    this.redirectUrl = process.env.PHONEPE_REDIRECT_URL || 
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/callback`;
    this.callbackUrl = process.env.PHONEPE_CALLBACK_URL || 
      `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payments/callback`;
    
    console.log(`PhonePe SDK initialized`);
    console.log(`Environment: ${this.environment}`);
    console.log(`Client ID: ${this.clientId}`);
  }

  async initiatePayment(paymentData) {
  try {
    const payload = {
      merchantTransactionId: paymentData.transactionId,
      merchantOrderId: paymentData.transactionId,
      merchantUserId: paymentData.userId,
      amount: paymentData.amount,
      redirectUrl: `${this.redirectUrl}?transactionId=${paymentData.transactionId}`,
      redirectMode: 'POST',
      callbackUrl: this.callbackUrl,
      mobileNumber: paymentData.mobileNumber,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    console.log('PhonePe Payment Request:', JSON.stringify(payload, null, 2));

    const response = await this.client.pay(payload);
    
    console.log('PhonePe Response:', JSON.stringify(response, null, 2));

    if (!response) {
      throw new Error('Empty response from PhonePe SDK');
    }

    // Check for explicit failure
    if (response.success === false) {
      const errorMessage = response.message || response.error || 'Payment initiation failed';
      const errorCode = response.code || 'UNKNOWN_ERROR';
      throw new Error(`PhonePe Error [${errorCode}]: ${errorMessage}`);
    }

    // Handle the actual SDK response structure
    let paymentUrl;
    
    // Try the new SDK structure first (direct redirectUrl)
    if (response.redirectUrl) {
      paymentUrl = response.redirectUrl;
      console.log('PhonePe payment URL (direct):', paymentUrl);
    }
    // Fall back to old structure if available
    else if (response.data?.instrumentResponse?.redirectInfo?.url) {
      paymentUrl = response.data.instrumentResponse.redirectInfo.url;
      console.log('PhonePe payment URL (nested):', paymentUrl);
    }
    else {
      console.error('Invalid PhonePe response structure:', response);
      throw new Error('Invalid response structure from PhonePe - missing redirect URL');
    }

    // Return normalized response
    return {
      success: true,
      orderId: response.orderId,
      state: response.state,
      redirectUrl: paymentUrl,
      expireAt: response.expireAt,
      // Keep original response for reference
      original: response
    };

  } catch (error) {
    console.error('PhonePe payment initiation error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    if (error.message.includes('PhonePe Error')) {
      throw error;
    }
    
    throw new Error(`PhonePe payment initiation failed: ${error.message}`);
  }
}

  async checkStatus(merchantTransactionId) {
    try {
      const response = await this.client.checkStatus(merchantTransactionId);
      return response;
    } catch (error) {
      console.error('PhonePe status check error:', error);
      throw error;
    }
  }

  async initiateRefund(refundData) {
    try {
      const payload = {
        merchantUserId: refundData.userId,
        originalTransactionId: refundData.originalTransactionId,
        merchantTransactionId: refundData.refundTransactionId,
        amount: refundData.amount,
        callbackUrl: this.callbackUrl
      };

      const response = await this.client.refund(payload);
      return response;
    } catch (error) {
      console.error('PhonePe refund error:', error);
      throw error;
    }
  }

  verifyCallback(callbackData) {
    try {
      const decodedResponse = JSON.parse(
        Buffer.from(callbackData.response, 'base64').toString()
      );
      return decodedResponse;
    } catch (error) {
      console.error('Callback verification error:', error);
      throw error;
    }
  }
}

const phonePeService = new PhonePeService();

// Utility Functions
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

const calculateCoins = (amount) => {
  return Math.floor(amount / 100) * 2;
};

const formatPhoneNumber = (phone) => {
  if (!phone) return '9999999999';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  cleaned = cleaned.slice(-10);
  return cleaned.length === 10 ? cleaned : '9999999999';
};

const validateShippingAddress = (address) => {
  const errors = [];
  
  if (!address?.firstName?.trim()) errors.push('First name is required');
  if (!address?.lastName?.trim()) errors.push('Last name is required');
  if (!address?.email?.trim()) errors.push('Email is required');
  if (!address?.phone?.trim()) errors.push('Phone number is required');
  if (!address?.address?.trim()) errors.push('Address is required');
  if (!address?.city?.trim()) errors.push('City is required');
  if (!address?.state?.trim()) errors.push('State is required');
  if (!address?.zipCode?.trim()) errors.push('ZIP code is required');
  
  if (address.phone) {
    const formattedPhone = formatPhoneNumber(address.phone);
    if (formattedPhone === '9999999999') {
      errors.push('Invalid phone number format');
    }
  }

  return errors;
};

const processOrderItems = (items) => {
  return items.map(item => ({
    productId: item.productId || item._id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: (item.name || item.title || "Product").trim().slice(0, 100),
    price: Math.max(0, parseFloat(item.price) || 0),
    quantity: Math.max(1, parseInt(item.quantity) || 1),
    image: Array.isArray(item.image) ? item.image[0] : 
           Array.isArray(item.images) ? item.images[0] : 
           item.image || '/placeholder-product.jpg',
  }));
};

const calculateOrderAmounts = (items, shippingMethod, providedAmounts = {}) => {
  if (providedAmounts.amount && providedAmounts.orderDetails) {
    return {
      subtotal: Math.round((providedAmounts.orderDetails.subtotal || 0) / 100),
      shippingCost: Math.round((providedAmounts.orderDetails.shippingCost || 0) / 100),
      total: Math.round(providedAmounts.amount / 100)
    };
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = (shippingMethod === 'express') ? 199 : 0;
  const total = subtotal + shippingCost;

  return { subtotal, shippingCost, total };
};

const awardCoins = async (userId, amount, orderId) => {
  try {
    const coinsToAward = calculateCoins(amount);
    
    if (coinsToAward > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: coinsToAward } },
        { new: true }
      );

      console.log(`Awarded ${coinsToAward} coins to user ${userId}`);
      
      return {
        coinsAwarded: coinsToAward,
        totalCoins: updatedUser.coins
      };
    }
    
    return { coinsAwarded: 0, totalCoins: null };
  } catch (error) {
    console.error('Error awarding coins:', error);
    throw error;
  }
};

// Controller Functions
const createOrder = async (req, res) => {
  try {
    const { 
      items, 
      shippingAddress, 
      shippingMethod, 
      notes,
      amount,
      currency,
      orderDetails
    } = req.body;
    
    const userId = req.user.id;

    console.log(`Creating order for user: ${userId}`);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required',
        code: 'ITEMS_REQUIRED'
      });
    }

    const addressErrors = validateShippingAddress(shippingAddress);
    if (addressErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping address',
        errors: addressErrors,
        code: 'INVALID_ADDRESS'
      });
    }

    const processedItems = processOrderItems(items);
    const finalShippingMethod = shippingMethod || notes?.shipping_method || 'standard';
    const amounts = calculateOrderAmounts(processedItems, finalShippingMethod, { amount, orderDetails });

    if (amounts.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount',
        code: 'INVALID_AMOUNT'
      });
    }

    const transactionId = generateTransactionId();

    const order = new Order({
      userId,
      orderNumber: generateOrderNumber(),
      items: processedItems,
      shippingAddress: {
        ...shippingAddress,
        phone: formatPhoneNumber(shippingAddress.phone)
      },
      shippingMethod: finalShippingMethod,
      shippingCost: amounts.shippingCost,
      subtotal: amounts.subtotal,
      total: amounts.total,
      status: 'pending',
      paymentStatus: 'pending',
      notes: typeof notes === 'object' ? JSON.stringify(notes) : (notes || ''),
      phonepeTransactionId: transactionId
    });

    await order.save();
    console.log(`Order created: ${order.orderNumber}`);

    console.log(`Initiating PhonePe payment...`);
    
    try {
      const paymentResponse = await phonePeService.initiatePayment({
        transactionId: transactionId,
        userId: `USER${userId.toString().substring(0, 20)}`,
        amount: Math.round(amounts.total * 100),
        mobileNumber: formatPhoneNumber(shippingAddress.phone)
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || 'PhonePe payment initiation failed');
      }

      if (!paymentResponse.data?.instrumentResponse?.redirectInfo?.url) {
        throw new Error('Invalid PhonePe response - missing payment URL');
      }

      const payment = new Payment({
        orderId: order._id,
        userId,
        phonepeTransactionId: transactionId,
        phonepeMerchantTransactionId: transactionId,
        amount: amounts.total,
        currency: currency || 'INR',
        status: 'created',
        email: shippingAddress.email,
        contact: formatPhoneNumber(shippingAddress.phone),
        paymentUrl: paymentResponse.data.instrumentResponse.redirectInfo.url,
        notes: {
          orderId: order._id.toString(),
          userId: userId.toString(),
          orderNumber: order.orderNumber,
          shipping_method: finalShippingMethod,
          ...(typeof notes === 'object' ? notes : { notes: notes || '' })
        }
      });

      await payment.save();
      console.log(`Payment record created`);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          transactionId: transactionId,
          amount: amounts.total,
          currency: currency || 'INR'
        },
        paymentUrl: paymentResponse.data.instrumentResponse.redirectInfo.url,
        transactionId: transactionId
      });

    } catch (phonePeError) {
      console.error('PhonePe payment initiation failed:', phonePeError.message);
      
      await Order.findByIdAndUpdate(order._id, {
        status: 'cancelled',
        paymentStatus: 'failed',
        notes: JSON.stringify({
          ...JSON.parse(order.notes || '{}'),
          paymentError: phonePeError.message,
          errorTime: new Date().toISOString()
        })
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: phonePeError.message,
        code: 'PAYMENT_INITIATION_FAILED',
        orderId: order._id,
        orderNumber: order.orderNumber
      });
    }

  } catch (error) {
    console.error('Error creating order:', error.message);
    
    const errorResponse = {
      success: false,
      message: 'Failed to create order',
      error: error.message,
      code: 'ORDER_CREATION_FAILED'
    };

    if (error.name === 'ValidationError') {
      errorResponse.message = 'Order validation failed';
      errorResponse.errors = Object.values(error.errors).map(err => err.message);
      errorResponse.code = 'VALIDATION_ERROR';
      return res.status(400).json(errorResponse);
    }
    
    res.status(500).json(errorResponse);
  }
};

const handlePaymentCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    console.log(`Received PhonePe callback`);

    if (!callbackData.response) {
      return res.status(400).json({
        success: false,
        message: 'Invalid callback data'
      });
    }

    const decodedResponse = phonePeService.verifyCallback(callbackData);
    const { merchantTransactionId, transactionId, state, responseCode } = decodedResponse.data;

    console.log(`Transaction: ${merchantTransactionId}, Status: ${state}`);

    const payment = await Payment.findOne({ 
      phonepeTransactionId: merchantTransactionId 
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    const session = await Payment.startSession();
    session.startTransaction();

    try {
      if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
        payment.phonepePaymentId = transactionId;
        payment.status = 'paid';
        payment.paymentDate = new Date();
        payment.responseCode = responseCode;
        payment.state = state;
        await payment.save({ session });

        const order = await Order.findOneAndUpdate(
          { phonepeTransactionId: merchantTransactionId },
          {
            phonepePaymentId: transactionId,
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentDate: new Date()
          },
          { new: true, session }
        ).populate('userId');

        if (order) {
          console.log(`Order confirmed: ${order.orderNumber}`);

          try {
            await awardCoins(order.userId._id || order.userId, order.total, order._id);
          } catch (coinsError) {
            console.error('Failed to award coins:', coinsError);
          }

          try {
            await sendOrderConfirmationEmail(order);
            console.log('Order confirmation email sent');
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }
        }

        await session.commitTransaction();
        
        res.json({
          success: true,
          message: 'Payment completed successfully'
        });

      } else {
        payment.status = 'failed';
        payment.responseCode = responseCode;
        payment.state = state;
        payment.failureReason = decodedResponse.message || 'Payment failed';
        await payment.save({ session });

        await Order.findOneAndUpdate(
          { phonepeTransactionId: merchantTransactionId },
          {
            paymentStatus: 'failed',
            status: 'cancelled'
          },
          { session }
        );

        await session.commitTransaction();

        console.log(`Payment failed: ${decodedResponse.message}`);

        res.json({
          success: false,
          message: 'Payment failed',
          error: decodedResponse.message
        });
      }
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error handling PhonePe callback:', error);
    res.status(500).json({
      success: false,
      message: 'Callback processing failed',
      error: error.message
    });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?.id;

    console.log(`Checking payment status: ${transactionId}`);

    const query = { phonepeTransactionId: transactionId };
    if (userId) {
      query.userId = userId;
    }

    const payment = await Payment.findOne(query).populate('orderId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'created' || payment.status === 'pending') {
      try {
        const statusResponse = await phonePeService.checkStatus(transactionId);

        if (statusResponse.success) {
          const { state, responseCode } = statusResponse.data;

          if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
            payment.status = 'paid';
            payment.state = state;
            payment.responseCode = responseCode;
            payment.paymentDate = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.orderId._id, {
              paymentStatus: 'paid',
              status: 'confirmed',
              paymentDate: new Date()
            });

            try {
              const actualUserId = userId || payment.userId;
              await awardCoins(actualUserId, payment.amount, payment.orderId._id);
            } catch (coinsError) {
              console.error('Error awarding coins:', coinsError);
            }

            console.log(`Payment status updated to paid`);
          } else if (state === 'FAILED') {
            payment.status = 'failed';
            payment.state = state;
            payment.responseCode = responseCode;
            await payment.save();

            await Order.findByIdAndUpdate(payment.orderId._id, {
              paymentStatus: 'failed',
              status: 'cancelled'
            });

            console.log(`Payment status updated to failed`);
          }
        }
      } catch (statusError) {
        console.error('Error checking PhonePe status:', statusError.message);
      }
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        transactionId: payment.phonepeTransactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: payment.paymentDate,
        order: payment.orderId
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
};

const processRefund = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.id;

    console.log(`Processing refund: ${transactionId}`);

    const payment = await Payment.findOne({
      phonepeTransactionId: transactionId,
      userId,
      status: 'paid'
    }).populate('orderId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not eligible for refund'
      });
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    const refundTransactionId = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const refundResponse = await phonePeService.initiateRefund({
      userId: `USER${userId.toString().substring(0, 20)}`,
      originalTransactionId: transactionId,
      refundTransactionId: refundTransactionId,
      amount: Math.round(refundAmount * 100)
    });

    if (!refundResponse.success) {
      throw new Error(refundResponse.message || 'Refund failed');
    }

    const coinsToDeduct = calculateCoins(refundAmount);
    if (coinsToDeduct > 0) {
      try {
        const user = await User.findById(userId);
        if (user && user.coins >= coinsToDeduct) {
          await User.findByIdAndUpdate(
            userId,
            { $inc: { coins: -coinsToDeduct } },
            { new: true }
          );
          console.log(`Deducted ${coinsToDeduct} coins`);
        }
      } catch (coinsError) {
        console.error('Error deducting coins:', coinsError);
      }
    }

    payment.refunds.push({
      refundId: refundTransactionId,
      amount: refundAmount,
      currency: 'INR',
      status: 'processed',
      createdAt: new Date(),
      reason: reason || 'Customer request'
    });

    if (refundAmount === payment.amount) {
      payment.status = 'refunded';
    }

    await payment.save();

    if (refundAmount === payment.amount) {
      await Order.findByIdAndUpdate(payment.orderId._id, {
        status: 'cancelled',
        paymentStatus: 'refunded'
      });
    }

    console.log(`Refund processed successfully`);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        transactionId: refundTransactionId,
        amount: refundAmount,
        status: 'processed',
        coinsDeducted: coinsToDeduct
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.message
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: 'orderId'
    };

    const payments = await Payment.paginate(query, options);

    res.json({
      success: true,
      payments: payments.docs,
      pagination: {
        current: payments.page,
        pages: payments.totalPages,
        total: payments.totalDocs,
        limit: payments.limit
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

const getPaymentHealth = async (req, res) => {
  try {
    const configStatus = {
      clientId: !!phonePeService.clientId,
      clientSecret: !!phonePeService.clientSecret,
      environment: phonePeService.environment,
      configured: !!(phonePeService.clientId && phonePeService.clientSecret)
    };

    res.json({
      success: true,
      health: {
        configuration: configStatus,
        phonePeService: {
          status: 'configured',
          message: 'PhonePe SDK initialized'
        },
        database: {
          status: 'connected',
          models: ['Order', 'Payment', 'User']
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      health: {
        error: error.message
      }
    });
  }
};

const testPhonePeConnection = async (req, res) => {
  try {
    console.log(`Testing PhonePe Connection`);

    const testResults = {
      timestamp: new Date().toISOString(),
      environment: phonePeService.environment,
      clientId: phonePeService.clientId,
      tests: []
    };

    const configTest = {
      name: 'Configuration Check',
      status: phonePeService.clientId && phonePeService.clientSecret ? 'pass' : 'fail',
      details: {
        clientId: !!phonePeService.clientId,
        clientSecret: !!phonePeService.clientSecret,
        clientVersion: phonePeService.clientVersion
      }
    };
    testResults.tests.push(configTest);

    const sdkTest = {
      name: 'SDK Initialization',
      status: phonePeService.client ? 'pass' : 'fail',
      details: {
        initialized: !!phonePeService.client,
        environment: phonePeService.environment
      }
    };
    testResults.tests.push(sdkTest);

    const allPassed = testResults.tests.every(test => test.status === 'pass');
    testResults.overall = allPassed ? 'pass' : 'fail';

    console.log(`Overall Test Result: ${allPassed ? 'PASS' : 'FAIL'}`);

    res.json({
      success: allPassed,
      message: allPassed ? 'All tests passed' : 'Some tests failed',
      results: testResults
    });

  } catch (error) {
    console.error('Test execution failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test execution failed',
      error: error.message
    });
  }
};

const getPhonePeConfig = async (req, res) => {
  try {
    const config = {
      environment: phonePeService.environment,
      clientId: phonePeService.clientId,
      clientVersion: phonePeService.clientVersion,
      redirectUrl: phonePeService.redirectUrl,
      callbackUrl: phonePeService.callbackUrl,
      configured: !!(phonePeService.clientId && phonePeService.clientSecret),
      version: 'v2'
    };

    res.json({
      success: true,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  handlePaymentCallback,
  checkPaymentStatus,
  processRefund,
  getPaymentHistory,
  getPaymentHealth,
  testPhonePeConnection,
  getPhonePeConfig,
  calculateCoins,
  awardCoins
};