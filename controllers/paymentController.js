// const { StandardCheckoutClient, StandardCheckoutPayRequest, Env, MetaInfo } = require('phonepe-pg-sdk-node');
// const Order = require('../models/Order');
// const Payment = require('../models/Payment');
// const User = require('../models/User');
// const { sendOrderConfirmationEmail } = require('../helpers/emailHelper');

// // PhonePe Official SDK Configuration
// class PhonePeService {
//   constructor() {
//     const isProduction = process.env.NODE_ENV === 'production';
    
//     this.clientId = isProduction 
//       ? process.env.PHONEPE_CLIENT_ID 
//       : (process.env.PHONEPE_CLIENT_ID || 'TEST-M23GT5WAJ1JPN_25091');
    
//     this.clientSecret = isProduction 
//       ? process.env.PHONEPE_CLIENT_SECRET 
//       : (process.env.PHONEPE_CLIENT_SECRET || 'NDlkMzljNDUtNjE2Zi00OGY1LWE1ZWMtZDI2ZTU3NDI2Y2Ri');
    
//     this.clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION) || 1;
//     this.environment = isProduction ? 'production' : 'UAT';
    
//     const env = isProduction ? Env.PRODUCTION : Env.SANDBOX;
    
//     this.client = StandardCheckoutClient.getInstance(
//       this.clientId,
//       this.clientSecret,
//       this.clientVersion,
//       env
//     );
    
//     this.redirectUrl = process.env.PHONEPE_REDIRECT_URL || 
//       `${process.env.CLIENT_URL || 'http://localhost:5175'}/payment/callback`;
//     this.callbackUrl = process.env.PHONEPE_CALLBACK_URL || 
//       `${process.env.SERVER_URL || 'http://localhost:5500'}/api/payments/callback`;
    
//     console.log(`PhonePe SDK initialized`);
//     console.log(`Environment: ${this.environment}`);
//     console.log(`Client ID: ${this.clientId}`);
//   }

//   // Create payment request using builder pattern with StandardCheckoutPayRequest
//   createPaymentRequest(paymentData) {
//     // Build MetaInfo with UDF fields
//     const metaInfoBuilder = MetaInfo.builder();
    
//     if (paymentData.metaInfo) {
//       if (paymentData.metaInfo.udf1) metaInfoBuilder.udf1(paymentData.metaInfo.udf1);
//       if (paymentData.metaInfo.udf2) metaInfoBuilder.udf2(paymentData.metaInfo.udf2);
//       if (paymentData.metaInfo.udf3) metaInfoBuilder.udf3(paymentData.metaInfo.udf3);
//       if (paymentData.metaInfo.udf4) metaInfoBuilder.udf4(paymentData.metaInfo.udf4);
//       if (paymentData.metaInfo.udf5) metaInfoBuilder.udf5(paymentData.metaInfo.udf5);
//     }
    
//     const metaInfo = metaInfoBuilder.build();

//     // Build payment request according to PhonePe documentation
//     const request = StandardCheckoutPayRequest.builder()
//       .merchantOrderId(paymentData.merchantOrderId)
//       .amount(paymentData.amount)
//       .redirectUrl(paymentData.redirectUrl)
//       .metaInfo(metaInfo);

//     return request.build();
//   }

//   async initiatePayment(paymentData) {
//     try {
//       console.log('Creating payment request with builder pattern...');
      
//       // Use StandardCheckoutPayRequest builder
//       const payRequest = this.createPaymentRequest(paymentData);

//       console.log('PhonePe Payment Request:', JSON.stringify(payRequest, null, 2));

//       // Execute payment
//       const response = await this.client.pay(payRequest);
      
//       console.log('PhonePe Response:', JSON.stringify(response, null, 2));

//       if (!response) {
//         throw new Error('Empty response from PhonePe SDK');
//       }

//       // Check for explicit failure
//       if (response.success === false) {
//         const errorMessage = response.message || response.error || 'Payment initiation failed';
//         const errorCode = response.code || 'UNKNOWN_ERROR';
//         throw new Error(`PhonePe Error [${errorCode}]: ${errorMessage}`);
//       }

//       // Handle the SDK response structure according to documentation
//       // Response contains: state, redirectUrl, orderId, expireAt
//       if (!response.redirectUrl) {
//         console.error('Invalid PhonePe response structure:', response);
//         throw new Error('Invalid response structure from PhonePe - missing redirect URL');
//       }

//       // Return normalized response
//       return {
//         success: true,
//         orderId: response.orderId,
//         state: response.state,
//         redirectUrl: response.redirectUrl,
//         expireAt: response.expireAt,
//         original: response
//       };

//     } catch (error) {
//       console.error('PhonePe payment initiation error:', {
//         message: error.message,
//         stack: error.stack,
//         response: error.response?.data
//       });

//       if (error.message.includes('PhonePe Error')) {
//         throw error;
//       }
      
//       throw new Error(`PhonePe payment initiation failed: ${error.message}`);
//     }
//   }

//   async checkStatus(merchantOrderId) {
//     try {
//       const response = await this.client.checkStatus(merchantOrderId);
//       return response;
//     } catch (error) {
//       console.error('PhonePe status check error:', error);
//       throw error;
//     }
//   }

//   async initiateRefund(refundData) {
//     try {
//       const payload = {
//         merchantUserId: refundData.userId,
//         originalTransactionId: refundData.originalTransactionId,
//         merchantTransactionId: refundData.refundTransactionId,
//         amount: refundData.amount,
//         callbackUrl: this.callbackUrl
//       };

//       const response = await this.client.refund(payload);
//       return response;
//     } catch (error) {
//       console.error('PhonePe refund error:', error);
//       throw error;
//     }
//   }

//   verifyCallback(callbackData) {
//     try {
//       const decodedResponse = JSON.parse(
//         Buffer.from(callbackData.response, 'base64').toString()
//       );
//       return decodedResponse;
//     } catch (error) {
//       console.error('Callback verification error:', error);
//       throw error;
//     }
//   }
// }

// const phonePeService = new PhonePeService();

// // Utility Functions
// const generateOrderNumber = () => {
//   return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
// };

// const generateMerchantOrderId = () => {
//   const { randomUUID } = require('crypto');
//   return randomUUID();
// };

// const calculateCoins = (amount) => {
//   return Math.floor(amount / 100) * 2;
// };

// const formatPhoneNumber = (phone) => {
//   if (!phone) return '9999999999';
//   let cleaned = String(phone).replace(/\D/g, '');
//   if (cleaned.startsWith('91') && cleaned.length > 10) {
//     cleaned = cleaned.substring(2);
//   }
//   cleaned = cleaned.slice(-10);
//   return cleaned.length === 10 ? cleaned : '9999999999';
// };

// const validateShippingAddress = (address) => {
//   const errors = [];
  
//   if (!address?.firstName?.trim()) errors.push('First name is required');
//   if (!address?.lastName?.trim()) errors.push('Last name is required');
//   if (!address?.email?.trim()) errors.push('Email is required');
//   if (!address?.phone?.trim()) errors.push('Phone number is required');
//   if (!address?.address?.trim()) errors.push('Address is required');
//   if (!address?.city?.trim()) errors.push('City is required');
//   if (!address?.state?.trim()) errors.push('State is required');
//   if (!address?.zipCode?.trim()) errors.push('ZIP code is required');
  
//   if (address.phone) {
//     const formattedPhone = formatPhoneNumber(address.phone);
//     if (formattedPhone === '9999999999') {
//       errors.push('Invalid phone number format');
//     }
//   }

//   return errors;
// };

// const processOrderItems = (items) => {
//   return items.map(item => ({
//     productId: item.productId || item._id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//     name: (item.name || item.title || "Product").trim().slice(0, 100),
//     price: Math.max(0, parseFloat(item.price) || 0),
//     quantity: Math.max(1, parseInt(item.quantity) || 1),
//     image: Array.isArray(item.image) ? item.image[0] : 
//            Array.isArray(item.images) ? item.images[0] : 
//            item.image || '/placeholder-product.jpg',
//   }));
// };

// const calculateOrderAmounts = (items, shippingMethod, providedAmounts = {}) => {
//   if (providedAmounts.amount && providedAmounts.orderDetails) {
//     return {
//       subtotal: Math.round((providedAmounts.orderDetails.subtotal || 0) / 100),
//       shippingCost: Math.round((providedAmounts.orderDetails.shippingCost || 0) / 100),
//       total: Math.round(providedAmounts.amount / 100)
//     };
//   }

//   const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   const shippingCost = (shippingMethod === 'express') ? 199 : 0;
//   const total = subtotal + shippingCost;

//   return { subtotal, shippingCost, total };
// };

// const awardCoins = async (userId, amount, orderId) => {
//   try {
//     const coinsToAward = calculateCoins(amount);
    
//     if (coinsToAward > 0) {
//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         { $inc: { coins: coinsToAward } },
//         { new: true }
//       );

//       console.log(`Awarded ${coinsToAward} coins to user ${userId}`);
      
//       return {
//         coinsAwarded: coinsToAward,
//         totalCoins: updatedUser.coins
//       };
//     }
    
//     return { coinsAwarded: 0, totalCoins: null };
//   } catch (error) {
//     console.error('Error awarding coins:', error);
//     throw error;
//   }
// };

// // Controller Functions
// const createOrder = async (req, res) => {
//   try {
//     const { 
//       items, 
//       shippingAddress, 
//       shippingMethod, 
//       notes,
//       amount,
//       currency,
//       orderDetails,
//       metaInfo // UDF fields from client
//     } = req.body;
    
//     const userId = req.user.id;

//     console.log(`Creating order for user: ${userId}`);

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Items are required',
//         code: 'ITEMS_REQUIRED'
//       });
//     }

//     const addressErrors = validateShippingAddress(shippingAddress);
//     if (addressErrors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid shipping address',
//         errors: addressErrors,
//         code: 'INVALID_ADDRESS'
//       });
//     }

//     const processedItems = processOrderItems(items);
//     const finalShippingMethod = shippingMethod || notes?.shipping_method || 'standard';
//     const amounts = calculateOrderAmounts(processedItems, finalShippingMethod, { amount, orderDetails });

//     if (amounts.total <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order amount',
//         code: 'INVALID_AMOUNT'
//       });
//     }

//     // Generate unique merchant order ID (UUID format as per documentation)
//     const merchantOrderId = generateMerchantOrderId();

//     const order = new Order({
//       userId,
//       orderNumber: generateOrderNumber(),
//       items: processedItems,
//       shippingAddress: {
//         ...shippingAddress,
//         phone: formatPhoneNumber(shippingAddress.phone)
//       },
//       shippingMethod: finalShippingMethod,
//       shippingCost: amounts.shippingCost,
//       subtotal: amounts.subtotal,
//       total: amounts.total,
//       status: 'pending',
//       paymentStatus: 'pending',
//       notes: typeof notes === 'object' ? JSON.stringify(notes) : (notes || ''),
//       phonepeTransactionId: merchantOrderId
//     });

//     await order.save();
//     console.log(`Order created: ${order.orderNumber}`);

//     console.log(`Initiating PhonePe payment with StandardCheckoutPayRequest builder...`);
    
//     try {
//       // Prepare meta info with UDF fields (max 256 characters each)
//       const paymentMetaInfo = {
//         udf1: order.orderNumber,
//         udf2: userId.toString().substring(0, 256),
//         udf3: finalShippingMethod,
//         udf4: metaInfo?.udf4 || shippingAddress.email.substring(0, 256),
//         udf5: metaInfo?.udf5 || order._id.toString()
//       };

//       const paymentResponse = await phonePeService.initiatePayment({
//         merchantOrderId: merchantOrderId,
//         amount: Math.round(amounts.total * 100), // Amount in paisa (minimum 100)
//         redirectUrl: `${phonePeService.redirectUrl}?merchantOrderId=${merchantOrderId}`,
//         metaInfo: paymentMetaInfo
//       });

//       if (!paymentResponse.success) {
//         throw new Error(paymentResponse.message || 'PhonePe payment initiation failed');
//       }

//       if (!paymentResponse.redirectUrl) {
//         throw new Error('Invalid PhonePe response - missing payment URL');
//       }

//       const payment = new Payment({
//         orderId: order._id,
//         userId,
//         phonepeTransactionId: merchantOrderId,
//         phonepeMerchantTransactionId: merchantOrderId,
//         phonepeOrderId: paymentResponse.orderId,
//         amount: amounts.total,
//         currency: currency || 'INR',
//         status: 'created',
//         state: paymentResponse.state,
//         email: shippingAddress.email,
//         contact: formatPhoneNumber(shippingAddress.phone),
//         paymentUrl: paymentResponse.redirectUrl,
//         expireAt: paymentResponse.expireAt,
//         notes: {
//           orderId: order._id.toString(),
//           userId: userId.toString(),
//           orderNumber: order.orderNumber,
//           shipping_method: finalShippingMethod,
//           phonepeOrderId: paymentResponse.orderId,
//           merchantOrderId: merchantOrderId,
//           ...(typeof notes === 'object' ? notes : { notes: notes || '' })
//         }
//       });

//       await payment.save();
//       console.log(`Payment record created with PhonePe Order ID: ${paymentResponse.orderId}`);

//       res.status(201).json({
//         success: true,
//         message: 'Order created successfully',
//         order: {
//           id: order._id,
//           orderNumber: order.orderNumber,
//           merchantOrderId: merchantOrderId,
//           phonepeOrderId: paymentResponse.orderId,
//           amount: amounts.total,
//           currency: currency || 'INR',
//           state: paymentResponse.state,
//           expireAt: paymentResponse.expireAt
//         },
//         paymentUrl: paymentResponse.redirectUrl,
//         merchantOrderId: merchantOrderId
//       });

//     } catch (phonePeError) {
//       console.error('PhonePe payment initiation failed:', phonePeError.message);
      
//       await Order.findByIdAndUpdate(order._id, {
//         status: 'cancelled',
//         paymentStatus: 'failed',
//         notes: JSON.stringify({
//           ...JSON.parse(order.notes || '{}'),
//           paymentError: phonePeError.message,
//           errorTime: new Date().toISOString()
//         })
//       });

//       return res.status(500).json({
//         success: false,
//         message: 'Failed to initiate payment',
//         error: phonePeError.message,
//         code: 'PAYMENT_INITIATION_FAILED',
//         orderId: order._id,
//         orderNumber: order.orderNumber
//       });
//     }

//   } catch (error) {
//     console.error('Error creating order:', error.message);
    
//     const errorResponse = {
//       success: false,
//       message: 'Failed to create order',
//       error: error.message,
//       code: 'ORDER_CREATION_FAILED'
//     };

//     if (error.name === 'ValidationError') {
//       errorResponse.message = 'Order validation failed';
//       errorResponse.errors = Object.values(error.errors).map(err => err.message);
//       errorResponse.code = 'VALIDATION_ERROR';
//       return res.status(400).json(errorResponse);
//     }
    
//     res.status(500).json(errorResponse);
//   }
// };

// const handlePaymentCallback = async (req, res) => {
//   try {
//     const callbackData = req.body;

//     console.log(`Received PhonePe callback`);

//     if (!callbackData.response) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid callback data'
//       });
//     }

//     const decodedResponse = phonePeService.verifyCallback(callbackData);
//     const { merchantTransactionId, transactionId, state, responseCode } = decodedResponse.data;

//     console.log(`MerchantOrderId: ${merchantTransactionId}, Status: ${state}`);

//     const payment = await Payment.findOne({ 
//       phonepeTransactionId: merchantTransactionId 
//     });

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment record not found'
//       });
//     }

//     const session = await Payment.startSession();
//     session.startTransaction();

//     try {
//       if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
//         payment.phonepePaymentId = transactionId;
//         payment.status = 'paid';
//         payment.paymentDate = new Date();
//         payment.responseCode = responseCode;
//         payment.state = state;
//         await payment.save({ session });

//         const order = await Order.findOneAndUpdate(
//           { phonepeTransactionId: merchantTransactionId },
//           {
//             phonepePaymentId: transactionId,
//             paymentStatus: 'paid',
//             status: 'confirmed',
//             paymentDate: new Date()
//           },
//           { new: true, session }
//         ).populate('userId');

//         if (order) {
//           console.log(`Order confirmed: ${order.orderNumber}`);

//           try {
//             await awardCoins(order.userId._id || order.userId, order.total, order._id);
//           } catch (coinsError) {
//             console.error('Failed to award coins:', coinsError);
//           }

//           try {
//             await sendOrderConfirmationEmail(order);
//             console.log('Order confirmation email sent');
//           } catch (emailError) {
//             console.error('Failed to send confirmation email:', emailError);
//           }
//         }

//         await session.commitTransaction();
        
//         res.json({
//           success: true,
//           message: 'Payment completed successfully'
//         });

//       } else {
//         payment.status = 'failed';
//         payment.responseCode = responseCode;
//         payment.state = state;
//         payment.failureReason = decodedResponse.message || 'Payment failed';
//         await payment.save({ session });

//         await Order.findOneAndUpdate(
//           { phonepeTransactionId: merchantTransactionId },
//           {
//             paymentStatus: 'failed',
//             status: 'cancelled'
//           },
//           { session }
//         );

//         await session.commitTransaction();

//         console.log(`Payment failed: ${decodedResponse.message}`);

//         res.json({
//           success: false,
//           message: 'Payment failed',
//           error: decodedResponse.message
//         });
//       }
//     } catch (transactionError) {
//       await session.abortTransaction();
//       throw transactionError;
//     } finally {
//       session.endSession();
//     }

//   } catch (error) {
//     console.error('Error handling PhonePe callback:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Callback processing failed',
//       error: error.message
//     });
//   }
// };

// const checkPaymentStatus = async (req, res) => {
//   try {
//     const { merchantOrderId } = req.params;
//     const userId = req.user?.id;

//     console.log(`Checking payment status: ${merchantOrderId}`);

//     const query = { phonepeTransactionId: merchantOrderId };
//     if (userId) {
//       query.userId = userId;
//     }

//     const payment = await Payment.findOne(query).populate('orderId');

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment not found'
//       });
//     }

//     if (payment.status === 'created' || payment.status === 'pending') {
//       try {
//         const statusResponse = await phonePeService.checkStatus(merchantOrderId);

//         if (statusResponse.success) {
//           const { state, responseCode } = statusResponse.data;

//           if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
//             payment.status = 'paid';
//             payment.state = state;
//             payment.responseCode = responseCode;
//             payment.paymentDate = new Date();
//             await payment.save();

//             await Order.findByIdAndUpdate(payment.orderId._id, {
//               paymentStatus: 'paid',
//               status: 'confirmed',
//               paymentDate: new Date()
//             });

//             try {
//               const actualUserId = userId || payment.userId;
//               await awardCoins(actualUserId, payment.amount, payment.orderId._id);
//             } catch (coinsError) {
//               console.error('Error awarding coins:', coinsError);
//             }

//             console.log(`Payment status updated to paid`);
//           } else if (state === 'FAILED') {
//             payment.status = 'failed';
//             payment.state = state;
//             payment.responseCode = responseCode;
//             await payment.save();

//             await Order.findByIdAndUpdate(payment.orderId._id, {
//               paymentStatus: 'failed',
//               status: 'cancelled'
//             });

//             console.log(`Payment status updated to failed`);
//           }
//         }
//       } catch (statusError) {
//         console.error('Error checking PhonePe status:', statusError.message);
//       }
//     }

//     res.json({
//       success: true,
//       payment: {
//         id: payment._id,
//         merchantOrderId: payment.phonepeTransactionId,
//         phonepeOrderId: payment.phonepeOrderId,
//         status: payment.status,
//         state: payment.state,
//         amount: payment.amount,
//         currency: payment.currency,
//         paymentDate: payment.paymentDate,
//         expireAt: payment.expireAt,
//         order: payment.orderId
//       }
//     });

//   } catch (error) {
//     console.error('Error checking payment status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to check payment status',
//       error: error.message
//     });
//   }
// };

// const processRefund = async (req, res) => {
//   try {
//     const { merchantOrderId } = req.params;
//     const { amount, reason } = req.body;
//     const userId = req.user.id;

//     console.log(`Processing refund: ${merchantOrderId}`);

//     const payment = await Payment.findOne({
//       phonepeTransactionId: merchantOrderId,
//       userId,
//       status: 'paid'
//     }).populate('orderId');

//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Payment not found or not eligible for refund'
//       });
//     }

//     const refundAmount = amount || payment.amount;
//     if (refundAmount > payment.amount) {
//       return res.status(400).json({
//         success: false,
//         message: 'Refund amount cannot exceed payment amount'
//       });
//     }

//     const refundTransactionId = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;

//     const refundResponse = await phonePeService.initiateRefund({
//       userId: `USER${userId.toString().substring(0, 20)}`,
//       originalTransactionId: merchantOrderId,
//       refundTransactionId: refundTransactionId,
//       amount: Math.round(refundAmount * 100)
//     });

//     if (!refundResponse.success) {
//       throw new Error(refundResponse.message || 'Refund failed');
//     }

//     const coinsToDeduct = calculateCoins(refundAmount);
//     if (coinsToDeduct > 0) {
//       try {
//         const user = await User.findById(userId);
//         if (user && user.coins >= coinsToDeduct) {
//           await User.findByIdAndUpdate(
//             userId,
//             { $inc: { coins: -coinsToDeduct } },
//             { new: true }
//           );
//           console.log(`Deducted ${coinsToDeduct} coins`);
//         }
//       } catch (coinsError) {
//         console.error('Error deducting coins:', coinsError);
//       }
//     }

//     payment.refunds.push({
//       refundId: refundTransactionId,
//       amount: refundAmount,
//       currency: 'INR',
//       status: 'processed',
//       createdAt: new Date(),
//       reason: reason || 'Customer request'
//     });

//     if (refundAmount === payment.amount) {
//       payment.status = 'refunded';
//     }

//     await payment.save();

//     if (refundAmount === payment.amount) {
//       await Order.findByIdAndUpdate(payment.orderId._id, {
//         status: 'cancelled',
//         paymentStatus: 'refunded'
//       });
//     }

//     console.log(`Refund processed successfully`);

//     res.json({
//       success: true,
//       message: 'Refund processed successfully',
//       refund: {
//         transactionId: refundTransactionId,
//         amount: refundAmount,
//         status: 'processed',
//         coinsDeducted: coinsToDeduct
//       }
//     });

//   } catch (error) {
//     console.error('Error processing refund:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Refund processing failed',
//       error: error.message
//     });
//   }
// };

// const getPaymentHistory = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { page = 1, limit = 10, status } = req.query;

//     const query = { userId };
//     if (status && status !== 'all') {
//       query.status = status;
//     }

//     const options = {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       sort: { createdAt: -1 },
//       populate: 'orderId'
//     };

//     const payments = await Payment.paginate(query, options);

//     res.json({
//       success: true,
//       payments: payments.docs,
//       pagination: {
//         current: payments.page,
//         pages: payments.totalPages,
//         total: payments.totalDocs,
//         limit: payments.limit
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching payment history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payment history',
//       error: error.message
//     });
//   }
// };

// const getPaymentHealth = async (req, res) => {
//   try {
//     const configStatus = {
//       clientId: !!phonePeService.clientId,
//       clientSecret: !!phonePeService.clientSecret,
//       environment: phonePeService.environment,
//       configured: !!(phonePeService.clientId && phonePeService.clientSecret)
//     };

//     res.json({
//       success: true,
//       health: {
//         configuration: configStatus,
//         phonePeService: {
//           status: 'configured',
//           message: 'PhonePe SDK initialized with StandardCheckoutPayRequest builder',
//           sdkVersion: 'phonepe-pg-sdk-node',
//           builderPattern: true
//         },
//         database: {
//           status: 'connected',
//           models: ['Order', 'Payment', 'User']
//         },
//         timestamp: new Date().toISOString()
//       }
//     });
//   } catch (error) {
//     res.status(503).json({
//       success: false,
//       health: {
//         error: error.message
//       }
//     });
//   }
// };

// const testPhonePeConnection = async (req, res) => {
//   try {
//     console.log(`Testing PhonePe Connection with StandardCheckoutPayRequest Builder`);

//     const testResults = {
//       timestamp: new Date().toISOString(),
//       environment: phonePeService.environment,
//       clientId: phonePeService.clientId,
//       tests: []
//     };

//     const configTest = {
//       name: 'Configuration Check',
//       status: phonePeService.clientId && phonePeService.clientSecret ? 'pass' : 'fail',
//       details: {
//         clientId: !!phonePeService.clientId,
//         clientSecret: !!phonePeService.clientSecret,
//         clientVersion: phonePeService.clientVersion,
//         environment: phonePeService.environment
//       }
//     };
//     testResults.tests.push(configTest);

//     const sdkTest = {
//       name: 'SDK Initialization',
//       status: phonePeService.client ? 'pass' : 'fail',
//       details: {
//         initialized: !!phonePeService.client,
//         environment: phonePeService.environment,
//         builderAvailable: typeof StandardCheckoutPayRequest.builder === 'function',
//         metaInfoAvailable: typeof MetaInfo.builder === 'function'
//       }
//     };
//     testResults.tests.push(sdkTest);

//     const allPassed = testResults.tests.every(test => test.status === 'pass');
//     testResults.overall = allPassed ? 'pass' : 'fail';

//     console.log(`Overall Test Result: ${allPassed ? 'PASS' : 'FAIL'}`);

//     res.json({
//       success: allPassed,
//       message: allPassed ? 'All tests passed' : 'Some tests failed',
//       results: testResults
//     });

//   } catch (error) {
//     console.error('Test execution failed:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Test execution failed',
//       error: error.message
//     });
//   }
// };

// const getPhonePeConfig = async (req, res) => {
//   try {
//     const config = {
//       environment: phonePeService.environment,
//       clientId: phonePeService.clientId,
//       clientVersion: phonePeService.clientVersion,
//       redirectUrl: phonePeService.redirectUrl,
//       callbackUrl: phonePeService.callbackUrl,
//       configured: !!(phonePeService.clientId && phonePeService.clientSecret),
//       version: 'v2',
//       builderPattern: true,
//       sdkType: 'StandardCheckoutPayRequest'
//     };

//     res.json({
//       success: true,
//       config
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch configuration',
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   createOrder,
//   handlePaymentCallback,
//   checkPaymentStatus,
//   processRefund,
//   getPaymentHistory,
//   getPaymentHealth,
//   testPhonePeConnection,
//   getPhonePeConfig,
//   calculateCoins,
//   awardCoins
// };






const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../helpers/emailHelper');

// PhonePe Production Service with Standard API
class PhonePeService {
  constructor() {
    const isProduction = process.env.PHONEPE_ENV === 'PROD';
    
    this.merchantId = process.env.PHONEPE_MERCHANT_ID;
    this.saltKey = process.env.PHONEPE_SALT_KEY;
    this.saltIndex = parseInt(process.env.PHONEPE_SALT_INDEX) || 1;
    this.environment = process.env.PHONEPE_ENV || 'UAT';
    
    // API URLs based on environment
    this.baseUrl = isProduction 
      ? 'https://api.phonepe.com/apis/hermes'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    
    this.redirectUrl = process.env.PHONEPE_REDIRECT_URL;
    this.callbackUrl = process.env.PHONEPE_CALLBACK_URL;
    
    console.log('='.repeat(50));
    console.log('PhonePe Service Configuration');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.environment}`);
    console.log(`Merchant ID: ${this.merchantId}`);
    console.log(`Salt Index: ${this.saltIndex}`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Redirect URL: ${this.redirectUrl}`);
    console.log(`Callback URL: ${this.callbackUrl}`);
    console.log('='.repeat(50));
    
    // Validate configuration
    if (!this.merchantId || !this.saltKey) {
      console.error('ERROR: PhonePe credentials not configured!');
      console.error('Required: PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY');
      throw new Error('PhonePe credentials not configured');
    }

    // Validate for UAT environment
    if (this.environment === 'UAT' && this.merchantId !== 'PGTESTPAYUAT') {
      console.warn('WARNING: Using UAT environment but merchant ID is not PGTESTPAYUAT');
      console.warn('This may cause "Key not found for the merchant" error');
      console.warn('For UAT testing, use: PHONEPE_MERCHANT_ID=PGTESTPAYUAT');
    }
  }

  // Generate X-VERIFY header signature
  generateSignature(payload) {
    const dataToHash = payload + '/pg/v1/pay' + this.saltKey;
    const sha256Hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    return `${sha256Hash}###${this.saltIndex}`;
  }

  // Generate signature for status check
  generateStatusSignature(merchantTransactionId) {
    const dataToHash = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}` + this.saltKey;
    const sha256Hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    return `${sha256Hash}###${this.saltIndex}`;
  }

  // Verify callback signature
  verifyCallbackSignature(xVerify, response) {
    try {
      const [receivedHash] = xVerify.split('###');
      const dataToHash = response + this.saltKey;
      const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
      return receivedHash === calculatedHash;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async initiatePayment(paymentData) {
    try {
      console.log('Initiating PhonePe payment...');
      console.log('Merchant ID:', this.merchantId);
      console.log('Amount (in paise):', paymentData.amount);
      
      // Prepare payment request payload
      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: paymentData.merchantTransactionId,
        merchantUserId: paymentData.merchantUserId,
        amount: paymentData.amount, // Amount in paise
        redirectUrl: paymentData.redirectUrl,
        redirectMode: 'POST',
        callbackUrl: this.callbackUrl,
        mobileNumber: paymentData.mobileNumber,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      console.log('Payment Payload:', JSON.stringify(payload, null, 2));

      // Base64 encode the payload
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Generate X-VERIFY signature
      const xVerify = this.generateSignature(base64Payload);

      console.log('Base64 Payload:', base64Payload.substring(0, 50) + '...');
      console.log('X-VERIFY:', xVerify.substring(0, 20) + '...');
      console.log('API URL:', `${this.baseUrl}/pg/v1/pay`);

      // Make API call to PhonePe
      const response = await axios.post(
        `${this.baseUrl}/pg/v1/pay`,
        {
          request: base64Payload
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'accept': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('PhonePe API Response Status:', response.status);
      console.log('PhonePe API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        return {
          success: true,
          code: response.data.code,
          message: response.data.message,
          data: {
            merchantId: response.data.data.merchantId,
            merchantTransactionId: response.data.data.merchantTransactionId,
            instrumentResponse: response.data.data.instrumentResponse
          },
          redirectUrl: response.data.data.instrumentResponse.redirectInfo.url
        };
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }

    } catch (error) {
      console.error('PhonePe payment initiation error:');
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
        
        // Detailed error message
        const errorMessage = error.response.data?.message || error.message;
        const errorCode = error.response.data?.code || 'UNKNOWN_ERROR';
        
        throw new Error(`PhonePe Error [${errorCode}]: ${errorMessage}`);
      } else if (error.request) {
        console.error('No response received from PhonePe');
        console.error('Request:', error.request);
        throw new Error('No response from PhonePe. Please check your internet connection.');
      }
      
      throw new Error(`PhonePe payment initiation failed: ${error.message}`);
    }
  }

  async checkStatus(merchantTransactionId) {
    try {
      console.log('Checking payment status for:', merchantTransactionId);
      
      const xVerify = this.generateStatusSignature(merchantTransactionId);

      const response = await axios.get(
        `${this.baseUrl}/pg/v1/status/${this.merchantId}/${merchantTransactionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'X-MERCHANT-ID': this.merchantId,
            'accept': 'application/json'
          }
        }
      );

      console.log('Status Check Response:', JSON.stringify(response.data, null, 2));

      return response.data;

    } catch (error) {
      console.error('PhonePe status check error:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  async initiateRefund(refundData) {
    try {
      const payload = {
        merchantId: this.merchantId,
        merchantUserId: refundData.merchantUserId,
        originalTransactionId: refundData.originalTransactionId,
        merchantTransactionId: refundData.merchantTransactionId,
        amount: refundData.amount,
        callbackUrl: this.callbackUrl
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const xVerify = this.generateSignature(base64Payload);

      const response = await axios.post(
        `${this.baseUrl}/pg/v1/refund`,
        {
          request: base64Payload
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'accept': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      console.error('PhonePe refund error:', error);
      throw error;
    }
  }

  verifyCallback(callbackData, xVerify) {
    try {
      // Verify signature first
      if (!this.verifyCallbackSignature(xVerify, callbackData.response)) {
        throw new Error('Invalid callback signature');
      }

      // Decode response
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

const generateMerchantTransactionId = () => {
  // PhonePe requires unique merchant transaction ID
  return `MT${Date.now()}${Math.floor(Math.random() * 10000)}`;
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

    // Validate minimum amount (PhonePe requirement: minimum 100 paise = ₹1)
    if (amounts.total < 1) {
      return res.status(400).json({
        success: false,
        message: 'Order amount must be at least ₹1',
        code: 'INVALID_AMOUNT'
      });
    }

    // Generate unique merchant transaction ID
    const merchantTransactionId = generateMerchantTransactionId();

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
      paymentMethod: 'phonepe',
      notes: typeof notes === 'object' ? JSON.stringify(notes) : (notes || ''),
      phonepeTransactionId: merchantTransactionId
    });

    await order.save();
    console.log(`Order created: ${order.orderNumber}`);

    console.log(`Initiating PhonePe payment...`);
    
    try {
      const paymentResponse = await phonePeService.initiatePayment({
        merchantTransactionId: merchantTransactionId,
        merchantUserId: `USER${userId.toString().substring(0, 20)}`,
        amount: Math.round(amounts.total * 100), // Convert to paise
        redirectUrl: `${phonePeService.redirectUrl}?merchantTransactionId=${merchantTransactionId}`,
        mobileNumber: formatPhoneNumber(shippingAddress.phone)
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || 'PhonePe payment initiation failed');
      }

      const payment = new Payment({
        orderId: order._id,
        userId,
        phonepeTransactionId: merchantTransactionId,
        phonepeMerchantTransactionId: merchantTransactionId,
        amount: amounts.total,
        currency: currency || 'INR',
        status: 'created',
        email: shippingAddress.email,
        contact: formatPhoneNumber(shippingAddress.phone),
        paymentUrl: paymentResponse.redirectUrl,
        notes: {
          orderId: order._id.toString(),
          userId: userId.toString(),
          orderNumber: order.orderNumber,
          shipping_method: finalShippingMethod,
          merchantTransactionId: merchantTransactionId,
          ...(typeof notes === 'object' ? notes : { notes: notes || '' })
        }
      });

      await payment.save();
      console.log(`Payment record created: ${merchantTransactionId}`);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          merchantTransactionId: merchantTransactionId,
          amount: amounts.total,
          currency: currency || 'INR'
        },
        paymentUrl: paymentResponse.redirectUrl,
        merchantTransactionId: merchantTransactionId
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
    const xVerify = req.headers['x-verify'];

    console.log(`Received PhonePe callback`);

    if (!callbackData.response || !xVerify) {
      return res.status(400).json({
        success: false,
        message: 'Invalid callback data'
      });
    }

    const decodedResponse = phonePeService.verifyCallback(callbackData, xVerify);
    const { merchantTransactionId, transactionId, code, state } = decodedResponse;

    console.log(`MerchantTransactionId: ${merchantTransactionId}, Status: ${state}, Code: ${code}`);

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
      if (code === 'PAYMENT_SUCCESS') {
        payment.phonepePaymentId = transactionId;
        payment.status = 'paid';
        payment.paymentDate = new Date();
        payment.responseCode = code;
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
            await Order.findByIdAndUpdate(order._id, { coinsGiven: true }, { session });
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
        payment.responseCode = code;
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
    const { merchantOrderId } = req.params;
    const userId = req.user?.id;

    console.log(`Checking payment status: ${merchantOrderId}`);

    const query = { phonepeTransactionId: merchantOrderId };
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
        const statusResponse = await phonePeService.checkStatus(merchantOrderId);

        if (statusResponse.success && statusResponse.code === 'PAYMENT_SUCCESS') {
          payment.status = 'paid';
          payment.responseCode = statusResponse.code;
          payment.paymentDate = new Date();
          payment.phonepePaymentId = statusResponse.data.transactionId;
          await payment.save();

          await Order.findByIdAndUpdate(payment.orderId._id, {
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentDate: new Date(),
            phonepePaymentId: statusResponse.data.transactionId
          });

          try {
            const actualUserId = userId || payment.userId;
            await awardCoins(actualUserId, payment.amount, payment.orderId._id);
            await Order.findByIdAndUpdate(payment.orderId._id, { coinsGiven: true });
          } catch (coinsError) {
            console.error('Error awarding coins:', coinsError);
          }

          console.log(`Payment status updated to paid`);
        } else if (statusResponse.code === 'PAYMENT_ERROR' || statusResponse.code === 'PAYMENT_DECLINED') {
          payment.status = 'failed';
          payment.responseCode = statusResponse.code;
          await payment.save();

          await Order.findByIdAndUpdate(payment.orderId._id, {
            paymentStatus: 'failed',
            status: 'cancelled'
          });

          console.log(`Payment status updated to failed`);
        }
      } catch (statusError) {
        console.error('Error checking PhonePe status:', statusError.message);
      }
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        merchantTransactionId: payment.phonepeTransactionId,
        status: payment.status,
        responseCode: payment.responseCode,
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
    const { merchantOrderId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.id;

    console.log(`Processing refund: ${merchantOrderId}`);

    const payment = await Payment.findOne({
      phonepeTransactionId: merchantOrderId,
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
      merchantUserId: `USER${userId.toString().substring(0, 20)}`,
      originalTransactionId: payment.phonepePaymentId,
      merchantTransactionId: refundTransactionId,
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
      merchantId: !!phonePeService.merchantId,
      saltKey: !!phonePeService.saltKey,
      environment: phonePeService.environment,
      configured: !!(phonePeService.merchantId && phonePeService.saltKey)
    };

    res.json({
      success: true,
      health: {
        configuration: configStatus,
        phonePeService: {
          status: 'configured',
          message: 'PhonePe Standard API configured',
          environment: phonePeService.environment,
          baseUrl: phonePeService.baseUrl
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
      merchantId: phonePeService.merchantId,
      tests: []
    };

    const configTest = {
      name: 'Configuration Check',
      status: phonePeService.merchantId && phonePeService.saltKey ? 'pass' : 'fail',
      details: {
        merchantId: !!phonePeService.merchantId,
        saltKey: !!phonePeService.saltKey,
        saltIndex: phonePeService.saltIndex,
        environment: phonePeService.environment,
        baseUrl: phonePeService.baseUrl
      }
    };
    testResults.tests.push(configTest);

    const urlTest = {
      name: 'URL Configuration',
      status: phonePeService.redirectUrl && phonePeService.callbackUrl ? 'pass' : 'fail',
      details: {
        redirectUrl: phonePeService.redirectUrl,
        callbackUrl: phonePeService.callbackUrl,
        baseUrl: phonePeService.baseUrl
      }
    };
    testResults.tests.push(urlTest);

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
      merchantId: phonePeService.merchantId,
      saltIndex: phonePeService.saltIndex,
      redirectUrl: phonePeService.redirectUrl,
      callbackUrl: phonePeService.callbackUrl,
      baseUrl: phonePeService.baseUrl,
      configured: !!(phonePeService.merchantId && phonePeService.saltKey),
      apiVersion: 'v1',
      paymentMethod: 'Standard API'
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