// const { StandardCheckoutClient, StandardCheckoutPayRequest, Env, MetaInfo } = require('phonepe-pg-sdk-node');
// const Order = require('../models/Order');
// const Payment = require('../models/Payment');
// const User = require('../models/User');
// const { sendOrderConfirmationEmail } = require('../helpers/emailHelper');
// const crypto = require('crypto');

// // PhonePe Official SDK Configuration
// class PhonePeService {
//   constructor() {
//     const isProduction = process.env.NODE_ENV === 'production';
    
//     // Merchant ID (required)
//     this.merchantId = process.env.PHONEPE_MERCHANT_ID || 'M23GT5WAJ1JPN';
    
//     // Client credentials
//     this.clientId = isProduction 
//       ? process.env.PHONEPE_CLIENT_ID 
//       : (process.env.PHONEPE_CLIENT_ID || 'TEST-M23GT5WAJ1JPN_25091');
    
//     this.clientSecret = isProduction 
//       ? process.env.PHONEPE_CLIENT_SECRET 
//       : (process.env.PHONEPE_CLIENT_SECRET || 'NDlkMzljNDUtNjE2Zi00OGY1LWE1ZWMtZDI2ZTU3NDI2Y2Ri');
    
//     this.clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION) || 1;
//     this.environment = isProduction ? 'PRODUCTION' : 'UAT';
    
//     // SDK Environment
//     const env = isProduction ? Env.PRODUCTION : Env.UAT;
    
//     // Initialize SDK client
//     try {
//       this.client = StandardCheckoutClient.getInstance(
//         this.clientId,
//         this.clientSecret,
//         this.clientVersion,
//         env
//       );
//     } catch (error) {
//       console.error('Failed to initialize PhonePe SDK:', error.message);
//       throw new Error('PhonePe SDK initialization failed');
//     }
    
//     // URLs
//     const baseClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
//     const baseServerUrl = process.env.SERVER_URL || 'http://localhost:5601';
    
//     this.redirectUrl = process.env.PHONEPE_REDIRECT_URL || `${baseClientUrl}/payment/callback`;
//     this.callbackUrl = process.env.PHONEPE_CALLBACK_URL || `${baseServerUrl}/api/payments/callback`;
    
//     console.log('========================================');
//     console.log('PhonePe SDK Initialized Successfully');
//     console.log('========================================');
//     console.log(`Environment: ${this.environment}`);
//     console.log(`Merchant ID: ${this.merchantId}`);
//     console.log(`Client ID: ${this.clientId}`);
//     console.log(`Redirect URL: ${this.redirectUrl}`);
//     console.log(`Callback URL: ${this.callbackUrl}`);
//     console.log('========================================');
//   }

//   // Generate unique merchant transaction ID
//   generateMerchantTransactionId() {
//     const timestamp = Date.now();
//     const random = crypto.randomBytes(8).toString('hex');
//     return `TXN_${this.merchantId}_${timestamp}_${random}`.substring(0, 35);
//   }

//   // Create payment request using builder pattern
//   createPaymentRequest(paymentData) {
//     try {
//       // Build MetaInfo with UDF fields (optional)
//       const metaInfoBuilder = MetaInfo.builder();
      
//       if (paymentData.metaInfo) {
//         if (paymentData.metaInfo.udf1) metaInfoBuilder.udf1(String(paymentData.metaInfo.udf1).substring(0, 256));
//         if (paymentData.metaInfo.udf2) metaInfoBuilder.udf2(String(paymentData.metaInfo.udf2).substring(0, 256));
//         if (paymentData.metaInfo.udf3) metaInfoBuilder.udf3(String(paymentData.metaInfo.udf3).substring(0, 256));
//         if (paymentData.metaInfo.udf4) metaInfoBuilder.udf4(String(paymentData.metaInfo.udf4).substring(0, 256));
//         if (paymentData.metaInfo.udf5) metaInfoBuilder.udf5(String(paymentData.metaInfo.udf5).substring(0, 256));
//       }
      
//       const metaInfo = metaInfoBuilder.build();

//       // Build payment request according to PhonePe documentation
//       const request = StandardCheckoutPayRequest.builder()
//         .merchantOrderId(paymentData.merchantOrderId)
//         .amount(paymentData.amount)
//         .redirectUrl(paymentData.redirectUrl)
//         .metaInfo(metaInfo);

//       return request.build();
//     } catch (error) {
//       console.error('Error creating payment request:', error);
//       throw new Error(`Failed to create payment request: ${error.message}`);
//     }
//   }

//   async initiatePayment(paymentData) {
//     try {
//       console.log('Initiating PhonePe payment with data:', {
//         merchantOrderId: paymentData.merchantOrderId,
//         amount: paymentData.amount,
//         redirectUrl: paymentData.redirectUrl
//       });
      
//       // Validate amount (minimum 100 paisa = ₹1)
//       if (paymentData.amount < 100) {
//         throw new Error('Payment amount must be at least ₹1 (100 paisa)');
//       }

//       // Create payment request using builder
//       const payRequest = this.createPaymentRequest(paymentData);

//       console.log('Payment request created successfully');

//       // Execute payment
//       const response = await this.client.pay(payRequest);
      
//       console.log('PhonePe SDK Response:', {
//         state: response?.state,
//         orderId: response?.orderId,
//         hasRedirectUrl: !!response?.redirectUrl
//       });

//       if (!response) {
//         throw new Error('Empty response received from PhonePe SDK');
//       }

//       // Check for explicit failure
//       if (response.success === false) {
//         const errorMessage = response.message || response.error || 'Payment initiation failed';
//         const errorCode = response.code || 'UNKNOWN_ERROR';
//         throw new Error(`PhonePe Error [${errorCode}]: ${errorMessage}`);
//       }

//       // Validate response structure
//       if (!response.redirectUrl) {
//         console.error('Invalid PhonePe response structure:', response);
//         throw new Error('Invalid response from PhonePe - missing payment redirect URL');
//       }

//       // Return normalized response
//       return {
//         success: true,
//         orderId: response.orderId,
//         state: response.state,
//         redirectUrl: response.redirectUrl,
//         expireAt: response.expireAt,
//         merchantOrderId: paymentData.merchantOrderId,
//         original: response
//       };

//     } catch (error) {
//       console.error('PhonePe payment initiation error:', {
//         message: error.message,
//         stack: error.stack
//       });

//       // Re-throw PhonePe specific errors
//       if (error.message.includes('PhonePe Error')) {
//         throw error;
//       }
      
//       throw new Error(`Payment initiation failed: ${error.message}`);
//     }
//   }

//   async checkStatus(merchantOrderId) {
//     try {
//       console.log(`Checking status for transaction: ${merchantOrderId}`);
//       const response = await this.client.checkStatus(merchantOrderId);
      
//       console.log('Status check response:', {
//         success: response?.success,
//         state: response?.data?.state,
//         responseCode: response?.data?.responseCode
//       });
      
//       return response;
//     } catch (error) {
//       console.error('PhonePe status check error:', error);
//       throw new Error(`Status check failed: ${error.message}`);
//     }
//   }

//   async initiateRefund(refundData) {
//     try {
//       console.log(`Initiating refund for transaction: ${refundData.originalTransactionId}`);
      
//       const payload = {
//         merchantUserId: refundData.userId,
//         originalTransactionId: refundData.originalTransactionId,
//         merchantTransactionId: refundData.refundTransactionId,
//         amount: refundData.amount,
//         callbackUrl: this.callbackUrl
//       };

//       const response = await this.client.refund(payload);
      
//       console.log('Refund response:', {
//         success: response?.success,
//         refundId: refundData.refundTransactionId
//       });
      
//       return response;
//     } catch (error) {
//       console.error('PhonePe refund error:', error);
//       throw new Error(`Refund failed: ${error.message}`);
//     }
//   }

//   verifyCallback(callbackData) {
//     try {
//       if (!callbackData || !callbackData.response) {
//         throw new Error('Invalid callback data structure');
//       }

//       const decodedResponse = JSON.parse(
//         Buffer.from(callbackData.response, 'base64').toString('utf-8')
//       );
      
//       console.log('Callback decoded:', {
//         merchantTransactionId: decodedResponse?.data?.merchantTransactionId,
//         state: decodedResponse?.data?.state,
//         responseCode: decodedResponse?.data?.responseCode
//       });
      
//       return decodedResponse;
//     } catch (error) {
//       console.error('Callback verification error:', error);
//       throw new Error(`Callback verification failed: ${error.message}`);
//     }
//   }
// }

// // Initialize service
// const phonePeService = new PhonePeService();

// // Utility Functions
// const generateOrderNumber = () => {
//   const timestamp = Date.now();
//   const random = Math.random().toString(36).substr(2, 9).toUpperCase();
//   return `ORD-${timestamp}-${random}`;
// };

// const calculateCoins = (amount) => {
//   // Award 2 coins per ₹100 spent
//   return Math.floor(amount / 100) * 2;
// };

// const formatPhoneNumber = (phone) => {
//   if (!phone) return '9999999999';
  
//   let cleaned = String(phone).replace(/\D/g, '');
  
//   // Remove country code if present
//   if (cleaned.startsWith('91') && cleaned.length > 10) {
//     cleaned = cleaned.substring(2);
//   }
  
//   // Get last 10 digits
//   cleaned = cleaned.slice(-10);
  
//   return cleaned.length === 10 ? cleaned : '9999999999';
// };

// const validateShippingAddress = (address) => {
//   const errors = [];
  
//   if (!address) {
//     errors.push('Shipping address is required');
//     return errors;
//   }
  
//   if (!address.firstName?.trim()) errors.push('First name is required');
//   if (!address.lastName?.trim()) errors.push('Last name is required');
//   if (!address.email?.trim()) errors.push('Email is required');
//   if (!address.phone?.trim()) errors.push('Phone number is required');
//   if (!address.address?.trim()) errors.push('Street address is required');
//   if (!address.city?.trim()) errors.push('City is required');
//   if (!address.state?.trim()) errors.push('State is required');
//   if (!address.zipCode?.trim()) errors.push('ZIP/Postal code is required');
  
//   // Validate email format
//   if (address.email) {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(address.email)) {
//       errors.push('Invalid email format');
//     }
//   }
  
//   // Validate phone number
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
//     productId: item.productId || item._id || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//     name: String(item.name || item.title || "Product").trim().slice(0, 100),
//     price: Math.max(0, parseFloat(item.price) || 0),
//     quantity: Math.max(1, parseInt(item.quantity) || 1),
//     image: Array.isArray(item.image) ? item.image[0] : 
//            Array.isArray(item.images) ? item.images[0] : 
//            item.image || '/placeholder-product.jpg',
//   }));
// };

// const calculateOrderAmounts = (items, shippingMethod) => {
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

//       if (!updatedUser) {
//         throw new Error('User not found');
//       }

//       console.log(`✓ Awarded ${coinsToAward} coins to user ${userId} for order ${orderId}`);
      
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
//       metaInfo
//     } = req.body;
    
//     const userId = req.user.id;

//     console.log(`\n========================================`);
//     console.log(`Creating order for user: ${userId}`);
//     console.log(`========================================`);

//     // Validate items
//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Items are required',
//         code: 'ITEMS_REQUIRED'
//       });
//     }

//     // Validate shipping address
//     const addressErrors = validateShippingAddress(shippingAddress);
//     if (addressErrors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid shipping address',
//         errors: addressErrors,
//         code: 'INVALID_ADDRESS'
//       });
//     }

//     // Process order data
//     const processedItems = processOrderItems(items);
//     const finalShippingMethod = shippingMethod || 'standard';
//     const amounts = calculateOrderAmounts(processedItems, finalShippingMethod);

//     // Validate order amount
//     if (amounts.total <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid order amount',
//         code: 'INVALID_AMOUNT'
//       });
//     }

//     // Generate unique merchant transaction ID
//     const merchantOrderId = phonePeService.generateMerchantTransactionId();
//     const orderNumber = generateOrderNumber();

//     console.log(`Order Number: ${orderNumber}`);
//     console.log(`Merchant Transaction ID: ${merchantOrderId}`);
//     console.log(`Total Amount: ₹${amounts.total}`);

//     // Create order in database
//     const order = new Order({
//       userId,
//       orderNumber,
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
//     console.log(`✓ Order saved to database`);

//     // Initiate PhonePe payment
//     try {
//       // Prepare meta info with UDF fields
//       const paymentMetaInfo = {
//         udf1: orderNumber,
//         udf2: userId.toString(),
//         udf3: finalShippingMethod,
//         udf4: shippingAddress.email,
//         udf5: order._id.toString()
//       };

//       const paymentResponse = await phonePeService.initiatePayment({
//         merchantOrderId,
//         amount: Math.round(amounts.total * 100), // Convert to paisa
//         redirectUrl: `${phonePeService.redirectUrl}?merchantOrderId=${merchantOrderId}`,
//         metaInfo: paymentMetaInfo
//       });

//       if (!paymentResponse.success || !paymentResponse.redirectUrl) {
//         throw new Error('Failed to get payment URL from PhonePe');
//       }

//       console.log(`✓ Payment initiated successfully`);
//       console.log(`PhonePe Order ID: ${paymentResponse.orderId}`);

//       // Create payment record
//       const payment = new Payment({
//         orderId: order._id,
//         userId,
//         phonepeTransactionId: merchantOrderId,
//         phonepeMerchantTransactionId: merchantOrderId,
//         phonepeOrderId: paymentResponse.orderId,
//         amount: amounts.total,
//         currency: 'INR',
//         status: 'created',
//         state: paymentResponse.state,
//         email: shippingAddress.email,
//         contact: formatPhoneNumber(shippingAddress.phone),
//         paymentUrl: paymentResponse.redirectUrl,
//         expireAt: paymentResponse.expireAt,
//         notes: {
//           orderId: order._id.toString(),
//           userId: userId.toString(),
//           orderNumber: orderNumber,
//           shipping_method: finalShippingMethod,
//           phonepeOrderId: paymentResponse.orderId,
//           merchantOrderId: merchantOrderId
//         }
//       });

//       await payment.save();
//       console.log(`✓ Payment record saved`);
//       console.log(`========================================\n`);

//       // Send success response
//       res.status(201).json({
//         success: true,
//         message: 'Order created successfully',
//         order: {
//           id: order._id,
//           orderNumber: orderNumber,
//           merchantOrderId: merchantOrderId,
//           phonepeOrderId: paymentResponse.orderId,
//           amount: amounts.total,
//           currency: 'INR',
//           state: paymentResponse.state,
//           expireAt: paymentResponse.expireAt
//         },
//         paymentUrl: paymentResponse.redirectUrl
//       });

//     } catch (phonePeError) {
//       console.error('❌ PhonePe payment initiation failed:', phonePeError.message);
      
//       // Update order status to failed
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
//         orderNumber: orderNumber
//       });
//     }

//   } catch (error) {
//     console.error('❌ Error creating order:', error.message);
    
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
//   const session = await Payment.startSession();
  
//   try {
//     const callbackData = req.body;

//     console.log(`\n========================================`);
//     console.log(`Received PhonePe Callback`);
//     console.log(`========================================`);

//     if (!callbackData || !callbackData.response) {
//       console.error('❌ Invalid callback data structure');
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid callback data'
//       });
//     }

//     // Decode and verify callback
//     const decodedResponse = phonePeService.verifyCallback(callbackData);
    
//     if (!decodedResponse.data) {
//       throw new Error('Invalid callback response structure');
//     }

//     const { merchantTransactionId, transactionId, state, responseCode } = decodedResponse.data;

//     console.log(`Transaction ID: ${merchantTransactionId}`);
//     console.log(`State: ${state}`);
//     console.log(`Response Code: ${responseCode}`);

//     // Find payment record
//     const payment = await Payment.findOne({ 
//       phonepeTransactionId: merchantTransactionId 
//     });

//     if (!payment) {
//       console.error('❌ Payment record not found');
//       return res.status(404).json({
//         success: false,
//         message: 'Payment record not found'
//       });
//     }

//     // Start transaction
//     session.startTransaction();

//     try {
//       if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
//         console.log('✓ Payment successful');
        
//         // Update payment record
//         payment.phonepePaymentId = transactionId;
//         payment.status = 'paid';
//         payment.paymentDate = new Date();
//         payment.responseCode = responseCode;
//         payment.state = state;
//         await payment.save({ session });

//         // Update order
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
//           console.log(`✓ Order confirmed: ${order.orderNumber}`);

//           // Award coins
//           try {
//             const coinsResult = await awardCoins(
//               order.userId._id || order.userId, 
//               order.total, 
//               order._id
//             );
//             console.log(`✓ Coins awarded: ${coinsResult.coinsAwarded}`);
//           } catch (coinsError) {
//             console.error('⚠ Failed to award coins:', coinsError.message);
//           }

//           // Send confirmation email
//           try {
//             await sendOrderConfirmationEmail(order);
//             console.log('✓ Confirmation email sent');
//           } catch (emailError) {
//             console.error('⚠ Failed to send email:', emailError.message);
//           }
//         }

//         await session.commitTransaction();
//         console.log(`========================================\n`);
        
//         res.json({
//           success: true,
//           message: 'Payment completed successfully'
//         });

//       } else {
//         console.log('❌ Payment failed or pending');
        
//         // Update payment as failed
//         payment.status = 'failed';
//         payment.responseCode = responseCode;
//         payment.state = state;
//         payment.failureReason = decodedResponse.message || 'Payment failed';
//         await payment.save({ session });

//         // Update order
//         await Order.findOneAndUpdate(
//           { phonepeTransactionId: merchantTransactionId },
//           {
//             paymentStatus: 'failed',
//             status: 'cancelled'
//           },
//           { session }
//         );

//         await session.commitTransaction();
//         console.log(`========================================\n`);

//         res.json({
//           success: false,
//           message: 'Payment failed',
//           error: decodedResponse.message
//         });
//       }
//     } catch (transactionError) {
//       await session.abortTransaction();
//       throw transactionError;
//     }

//   } catch (error) {
//     console.error('❌ Error handling callback:', error);
//     console.log(`========================================\n`);
    
//     res.status(500).json({
//       success: false,
//       message: 'Callback processing failed',
//       error: error.message
//     });
//   } finally {
//     session.endSession();
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

//     // Check with PhonePe if payment is still pending
//     if (payment.status === 'created' || payment.status === 'pending') {
//       try {
//         const statusResponse = await phonePeService.checkStatus(merchantOrderId);

//         if (statusResponse.success && statusResponse.data) {
//           const { state, responseCode, transactionId } = statusResponse.data;

//           if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
//             // Update payment
//             payment.status = 'paid';
//             payment.state = state;
//             payment.responseCode = responseCode;
//             payment.phonepePaymentId = transactionId;
//             payment.paymentDate = new Date();
//             await payment.save();

//             // Update order
//             await Order.findByIdAndUpdate(payment.orderId._id, {
//               paymentStatus: 'paid',
//               status: 'confirmed',
//               phonepePaymentId: transactionId,
//               paymentDate: new Date()
//             });

//             // Award coins
//             try {
//               const actualUserId = userId || payment.userId;
//               await awardCoins(actualUserId, payment.amount, payment.orderId._id);
//             } catch (coinsError) {
//               console.error('Error awarding coins:', coinsError);
//             }

//             console.log(`✓ Payment status updated to paid`);
            
//           } else if (state === 'FAILED') {
//             payment.status = 'failed';
//             payment.state = state;
//             payment.responseCode = responseCode;
//             await payment.save();

//             await Order.findByIdAndUpdate(payment.orderId._id, {
//               paymentStatus: 'failed',
//               status: 'cancelled'
//             });

//             console.log(`✓ Payment status updated to failed`);
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
//         phonepePaymentId: payment.phonepePaymentId,
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

//     console.log(`\n========================================`);
//     console.log(`Processing refund: ${merchantOrderId}`);
//     console.log(`========================================`);

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

//     // Generate refund transaction ID
//     const refundTransactionId = `REF_${phonePeService.merchantId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`.substring(0, 35);

//     console.log(`Refund Transaction ID: ${refundTransactionId}`);
//     console.log(`Refund Amount: ₹${refundAmount}`);

//     const refundResponse = await phonePeService.initiateRefund({
//       userId: `USER_${userId.toString().substring(0, 15)}`,
//       originalTransactionId: merchantOrderId,
//       refundTransactionId: refundTransactionId,
//       amount: Math.round(refundAmount * 100)
//     });

//     if (!refundResponse.success) {
//       throw new Error(refundResponse.message || 'Refund failed');
//     }

//     console.log(`✓ Refund initiated successfully`);

//     // Deduct coins
//     const coinsToDeduct = calculateCoins(refundAmount);
//     if (coinsToDeduct > 0) {
//       try {
//         const user = await User.findById(userId);
//         if (user && user.coins >= coinsToDeduct) {
//           await User.findByIdAndUpdate(
//             userId,
//             { $inc: { coins: -coinsToDeduct } }
//           );
//           console.log(`✓ Deducted ${coinsToDeduct} coins`);
//         }
//       } catch (coinsError) {
//         console.error('⚠ Error deducting coins:', coinsError);
//       }
//     }

//     // Update payment record
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

//     // Update order if full refund
//     if (refundAmount === payment.amount) {
//       await Order.findByIdAndUpdate(payment.orderId._id, {
//         status: 'cancelled',
//         paymentStatus: 'refunded'
//       });
//     }

//     console.log(`✓ Refund processed successfully`);
//     console.log(`========================================\n`);

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
//     console.error('❌ Error processing refund:', error);
//     console.log(`========================================\n`);
    
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
//       merchantId: !!phonePeService.merchantId,
//       clientId: !!phonePeService.clientId,
//       clientSecret: !!phonePeService.clientSecret,
//       environment: phonePeService.environment,
//       configured: !!(phonePeService.merchantId && phonePeService.clientId && phonePeService.clientSecret)
//     };

//     res.json({
//       success: true,
//       health: {
//         configuration: configStatus,
//         phonePeService: {
//           status: configStatus.configured ? 'healthy' : 'misconfigured',
//           message: 'PhonePe SDK initialized with StandardCheckoutPayRequest',
//           sdkVersion: 'phonepe-pg-sdk-node',
//           builderPattern: true,
//           merchantId: phonePeService.merchantId,
//           environment: phonePeService.environment
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
//         status: 'error',
//         error: error.message
//       }
//     });
//   }
// };

// const testPhonePeConnection = async (req, res) => {
//   try {
//     console.log(`\n========================================`);
//     console.log(`Testing PhonePe Connection`);
//     console.log(`========================================`);

//     const testResults = {
//       timestamp: new Date().toISOString(),
//       environment: phonePeService.environment,
//       merchantId: phonePeService.merchantId,
//       clientId: phonePeService.clientId,
//       tests: []
//     };

//     // Test 1: Configuration Check
//     const configTest = {
//       name: 'Configuration Check',
//       status: (phonePeService.merchantId && phonePeService.clientId && phonePeService.clientSecret) ? 'pass' : 'fail',
//       details: {
//         merchantId: !!phonePeService.merchantId,
//         clientId: !!phonePeService.clientId,
//         clientSecret: !!phonePeService.clientSecret,
//         clientVersion: phonePeService.clientVersion,
//         environment: phonePeService.environment
//       }
//     };
//     testResults.tests.push(configTest);
//     console.log(`Test 1: Configuration - ${configTest.status.toUpperCase()}`);

//     // Test 2: SDK Initialization
//     const sdkTest = {
//       name: 'SDK Initialization',
//       status: phonePeService.client ? 'pass' : 'fail',
//       details: {
//         initialized: !!phonePeService.client,
//         environment: phonePeService.environment,
//         builderAvailable: typeof StandardCheckoutPayRequest?.builder === 'function',
//         metaInfoAvailable: typeof MetaInfo?.builder === 'function'
//       }
//     };
//     testResults.tests.push(sdkTest);
//     console.log(`Test 2: SDK Initialization - ${sdkTest.status.toUpperCase()}`);

//     // Test 3: URL Configuration
//     const urlTest = {
//       name: 'URL Configuration',
//       status: (phonePeService.redirectUrl && phonePeService.callbackUrl) ? 'pass' : 'fail',
//       details: {
//         redirectUrl: !!phonePeService.redirectUrl,
//         callbackUrl: !!phonePeService.callbackUrl,
//         redirectUrlValue: phonePeService.redirectUrl,
//         callbackUrlValue: phonePeService.callbackUrl
//       }
//     };
//     testResults.tests.push(urlTest);
//     console.log(`Test 3: URL Configuration - ${urlTest.status.toUpperCase()}`);

//     // Test 4: Transaction ID Generation
//     let generatedTxnId = null;
//     try {
//       generatedTxnId = phonePeService.generateMerchantTransactionId();
//       const txnIdTest = {
//         name: 'Transaction ID Generation',
//         status: (generatedTxnId && generatedTxnId.length <= 35) ? 'pass' : 'fail',
//         details: {
//           generated: !!generatedTxnId,
//           length: generatedTxnId?.length || 0,
//           sample: generatedTxnId,
//           maxLength: 35
//         }
//       };
//       testResults.tests.push(txnIdTest);
//       console.log(`Test 4: Transaction ID Generation - ${txnIdTest.status.toUpperCase()}`);
//     } catch (error) {
//       testResults.tests.push({
//         name: 'Transaction ID Generation',
//         status: 'fail',
//         error: error.message
//       });
//       console.log(`Test 4: Transaction ID Generation - FAIL`);
//     }

//     // Overall result
//     const allPassed = testResults.tests.every(test => test.status === 'pass');
//     testResults.overall = allPassed ? 'pass' : 'fail';

//     console.log(`\nOverall Test Result: ${allPassed ? 'PASS ✓' : 'FAIL ✗'}`);
//     console.log(`========================================\n`);

//     res.json({
//       success: allPassed,
//       message: allPassed ? 'All tests passed' : 'Some tests failed',
//       results: testResults
//     });

//   } catch (error) {
//     console.error('❌ Test execution failed:', error);
//     console.log(`========================================\n`);
    
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
//       merchantId: phonePeService.merchantId,
//       environment: phonePeService.environment,
//       clientId: phonePeService.clientId,
//       clientVersion: phonePeService.clientVersion,
//       redirectUrl: phonePeService.redirectUrl,
//       callbackUrl: phonePeService.callbackUrl,
//       configured: !!(phonePeService.merchantId && phonePeService.clientId && phonePeService.clientSecret),
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


const { StandardCheckoutClient, StandardCheckoutPayRequest, Env, MetaInfo } = require('phonepe-pg-sdk-node');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../helpers/emailHelper');
const crypto = require('crypto');

// PhonePe Production SDK Configuration
class PhonePeService {
  constructor() {
    // Production mode only
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('This service is configured for production only. Set NODE_ENV=production');
    }
    
    // Merchant ID (required)
    this.merchantId = process.env.PHONEPE_MERCHANT_ID;
    if (!this.merchantId) {
      throw new Error('PHONEPE_MERCHANT_ID is required');
    }
    
    // Production credentials (required)
    this.clientId = process.env.PHONEPE_CLIENT_ID;
    this.clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET are required for production');
    }
    
    this.clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION) || 1;
    this.environment = 'PRODUCTION';
    
    // Initialize SDK with production environment
    try {
      this.client = StandardCheckoutClient.getInstance(
        this.clientId,
        this.clientSecret,
        this.clientVersion,
        Env.PRODUCTION
      );
    } catch (error) {
      console.error('Failed to initialize PhonePe SDK:', error.message);
      throw new Error('PhonePe SDK initialization failed');
    }
    
    // Production URLs (required)
    this.redirectUrl = process.env.PHONEPE_REDIRECT_URL;
    this.callbackUrl = process.env.PHONEPE_CALLBACK_URL;
    
    if (!this.redirectUrl || !this.callbackUrl) {
      throw new Error('PHONEPE_REDIRECT_URL and PHONEPE_CALLBACK_URL are required');
    }
    
    console.log('========================================');
    console.log('PhonePe Production SDK Initialized');
    console.log('========================================');
    console.log(`Environment: ${this.environment}`);
    console.log(`Merchant ID: ${this.merchantId}`);
    console.log(`Client ID: ${this.clientId}`);
    console.log(`Redirect URL: ${this.redirectUrl}`);
    console.log(`Callback URL: ${this.callbackUrl}`);
    console.log('========================================');
  }

  generateMerchantTransactionId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `TXN_${this.merchantId}_${timestamp}_${random}`.substring(0, 35);
  }

  createPaymentRequest(paymentData) {
    try {
      const metaInfoBuilder = MetaInfo.builder();
      
      if (paymentData.metaInfo) {
        if (paymentData.metaInfo.udf1) metaInfoBuilder.udf1(String(paymentData.metaInfo.udf1).substring(0, 256));
        if (paymentData.metaInfo.udf2) metaInfoBuilder.udf2(String(paymentData.metaInfo.udf2).substring(0, 256));
        if (paymentData.metaInfo.udf3) metaInfoBuilder.udf3(String(paymentData.metaInfo.udf3).substring(0, 256));
        if (paymentData.metaInfo.udf4) metaInfoBuilder.udf4(String(paymentData.metaInfo.udf4).substring(0, 256));
        if (paymentData.metaInfo.udf5) metaInfoBuilder.udf5(String(paymentData.metaInfo.udf5).substring(0, 256));
      }
      
      const metaInfo = metaInfoBuilder.build();

      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(paymentData.merchantOrderId)
        .amount(paymentData.amount)
        .redirectUrl(paymentData.redirectUrl)
        .metaInfo(metaInfo);

      return request.build();
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw new Error(`Failed to create payment request: ${error.message}`);
    }
  }

  async initiatePayment(paymentData) {
    try {
      console.log('Initiating PhonePe payment with data:', {
        merchantOrderId: paymentData.merchantOrderId,
        amount: paymentData.amount,
        redirectUrl: paymentData.redirectUrl
      });
      
      if (paymentData.amount < 100) {
        throw new Error('Payment amount must be at least ₹1 (100 paisa)');
      }

      const payRequest = this.createPaymentRequest(paymentData);
      const response = await this.client.pay(payRequest);
      
      console.log('PhonePe SDK Response:', {
        state: response?.state,
        orderId: response?.orderId,
        hasRedirectUrl: !!response?.redirectUrl
      });

      if (!response) {
        throw new Error('Empty response received from PhonePe SDK');
      }

      if (response.success === false) {
        const errorMessage = response.message || response.error || 'Payment initiation failed';
        const errorCode = response.code || 'UNKNOWN_ERROR';
        throw new Error(`PhonePe Error [${errorCode}]: ${errorMessage}`);
      }

      if (!response.redirectUrl) {
        console.error('Invalid PhonePe response structure:', response);
        throw new Error('Invalid response from PhonePe - missing payment redirect URL');
      }

      return {
        success: true,
        orderId: response.orderId,
        state: response.state,
        redirectUrl: response.redirectUrl,
        expireAt: response.expireAt,
        merchantOrderId: paymentData.merchantOrderId,
        original: response
      };

    } catch (error) {
      console.error('PhonePe payment initiation error:', {
        message: error.message,
        stack: error.stack
      });

      if (error.message.includes('PhonePe Error')) {
        throw error;
      }
      
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  async checkStatus(merchantOrderId) {
    try {
      console.log(`Checking status for transaction: ${merchantOrderId}`);
      const response = await this.client.checkStatus(merchantOrderId);
      
      console.log('Status check response:', {
        success: response?.success,
        state: response?.data?.state,
        responseCode: response?.data?.responseCode
      });
      
      return response;
    } catch (error) {
      console.error('PhonePe status check error:', error);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  async initiateRefund(refundData) {
    try {
      console.log(`Initiating refund for transaction: ${refundData.originalTransactionId}`);
      
      const payload = {
        merchantUserId: refundData.userId,
        originalTransactionId: refundData.originalTransactionId,
        merchantTransactionId: refundData.refundTransactionId,
        amount: refundData.amount,
        callbackUrl: this.callbackUrl
      };

      const response = await this.client.refund(payload);
      
      console.log('Refund response:', {
        success: response?.success,
        refundId: refundData.refundTransactionId
      });
      
      return response;
    } catch (error) {
      console.error('PhonePe refund error:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  verifyCallback(callbackData) {
    try {
      if (!callbackData || !callbackData.response) {
        throw new Error('Invalid callback data structure');
      }

      const decodedResponse = JSON.parse(
        Buffer.from(callbackData.response, 'base64').toString('utf-8')
      );
      
      console.log('Callback decoded:', {
        merchantTransactionId: decodedResponse?.data?.merchantTransactionId,
        state: decodedResponse?.data?.state,
        responseCode: decodedResponse?.data?.responseCode
      });
      
      return decodedResponse;
    } catch (error) {
      console.error('Callback verification error:', error);
      throw new Error(`Callback verification failed: ${error.message}`);
    }
  }
}

// Initialize service
const phonePeService = new PhonePeService();

// Utility Functions
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `ORD-${timestamp}-${random}`;
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
  
  if (!address) {
    errors.push('Shipping address is required');
    return errors;
  }
  
  if (!address.firstName?.trim()) errors.push('First name is required');
  if (!address.lastName?.trim()) errors.push('Last name is required');
  if (!address.email?.trim()) errors.push('Email is required');
  if (!address.phone?.trim()) errors.push('Phone number is required');
  if (!address.address?.trim()) errors.push('Street address is required');
  if (!address.city?.trim()) errors.push('City is required');
  if (!address.state?.trim()) errors.push('State is required');
  if (!address.zipCode?.trim()) errors.push('ZIP/Postal code is required');
  
  if (address.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email)) {
      errors.push('Invalid email format');
    }
  }
  
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
    productId: item.productId || item._id || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: String(item.name || item.title || "Product").trim().slice(0, 100),
    price: Math.max(0, parseFloat(item.price) || 0),
    quantity: Math.max(1, parseInt(item.quantity) || 1),
    image: Array.isArray(item.image) ? item.image[0] : 
           Array.isArray(item.images) ? item.images[0] : 
           item.image || '/placeholder-product.jpg',
  }));
};

const calculateOrderAmounts = (items, shippingMethod) => {
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

      if (!updatedUser) {
        throw new Error('User not found');
      }

      console.log(`✓ Awarded ${coinsToAward} coins to user ${userId} for order ${orderId}`);
      
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
      metaInfo
    } = req.body;
    
    const userId = req.user.id;

    console.log(`\n========================================`);
    console.log(`Creating order for user: ${userId}`);
    console.log(`========================================`);

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
    const finalShippingMethod = shippingMethod || 'standard';
    const amounts = calculateOrderAmounts(processedItems, finalShippingMethod);

    if (amounts.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount',
        code: 'INVALID_AMOUNT'
      });
    }

    const merchantOrderId = phonePeService.generateMerchantTransactionId();
    const orderNumber = generateOrderNumber();

    console.log(`Order Number: ${orderNumber}`);
    console.log(`Merchant Transaction ID: ${merchantOrderId}`);
    console.log(`Total Amount: ₹${amounts.total}`);

    const order = new Order({
      userId,
      orderNumber,
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
      phonepeTransactionId: merchantOrderId
    });

    await order.save();
    console.log(`✓ Order saved to database`);

    try {
      const paymentMetaInfo = {
        udf1: orderNumber,
        udf2: userId.toString(),
        udf3: finalShippingMethod,
        udf4: shippingAddress.email,
        udf5: order._id.toString()
      };

      const paymentResponse = await phonePeService.initiatePayment({
        merchantOrderId,
        amount: Math.round(amounts.total * 100),
        redirectUrl: `${phonePeService.redirectUrl}?merchantOrderId=${merchantOrderId}`,
        metaInfo: paymentMetaInfo
      });

      if (!paymentResponse.success || !paymentResponse.redirectUrl) {
        throw new Error('Failed to get payment URL from PhonePe');
      }

      console.log(`✓ Payment initiated successfully`);
      console.log(`PhonePe Order ID: ${paymentResponse.orderId}`);

      const payment = new Payment({
        orderId: order._id,
        userId,
        phonepeTransactionId: merchantOrderId,
        phonepeMerchantTransactionId: merchantOrderId,
        phonepeOrderId: paymentResponse.orderId,
        amount: amounts.total,
        currency: 'INR',
        status: 'created',
        state: paymentResponse.state,
        email: shippingAddress.email,
        contact: formatPhoneNumber(shippingAddress.phone),
        paymentUrl: paymentResponse.redirectUrl,
        expireAt: paymentResponse.expireAt,
        notes: {
          orderId: order._id.toString(),
          userId: userId.toString(),
          orderNumber: orderNumber,
          shipping_method: finalShippingMethod,
          phonepeOrderId: paymentResponse.orderId,
          merchantOrderId: merchantOrderId
        }
      });

      await payment.save();
      console.log(`✓ Payment record saved`);
      console.log(`========================================\n`);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: {
          id: order._id,
          orderNumber: orderNumber,
          merchantOrderId: merchantOrderId,
          phonepeOrderId: paymentResponse.orderId,
          amount: amounts.total,
          currency: 'INR',
          state: paymentResponse.state,
          expireAt: paymentResponse.expireAt
        },
        paymentUrl: paymentResponse.redirectUrl
      });

    } catch (phonePeError) {
      console.error('❌ PhonePe payment initiation failed:', phonePeError.message);
      
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
        orderNumber: orderNumber
      });
    }

  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    
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
  const session = await Payment.startSession();
  
  try {
    const callbackData = req.body;

    console.log(`\n========================================`);
    console.log(`Received PhonePe Callback`);
    console.log(`========================================`);

    if (!callbackData || !callbackData.response) {
      console.error('❌ Invalid callback data structure');
      return res.status(400).json({
        success: false,
        message: 'Invalid callback data'
      });
    }

    const decodedResponse = phonePeService.verifyCallback(callbackData);
    
    if (!decodedResponse.data) {
      throw new Error('Invalid callback response structure');
    }

    const { merchantTransactionId, transactionId, state, responseCode } = decodedResponse.data;

    console.log(`Transaction ID: ${merchantTransactionId}`);
    console.log(`State: ${state}`);
    console.log(`Response Code: ${responseCode}`);

    const payment = await Payment.findOne({ 
      phonepeTransactionId: merchantTransactionId 
    });

    if (!payment) {
      console.error('❌ Payment record not found');
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    session.startTransaction();

    try {
      if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
        console.log('✓ Payment successful');
        
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
          console.log(`✓ Order confirmed: ${order.orderNumber}`);

          try {
            const coinsResult = await awardCoins(
              order.userId._id || order.userId, 
              order.total, 
              order._id
            );
            console.log(`✓ Coins awarded: ${coinsResult.coinsAwarded}`);
          } catch (coinsError) {
            console.error('⚠ Failed to award coins:', coinsError.message);
          }

          try {
            await sendOrderConfirmationEmail(order);
            console.log('✓ Confirmation email sent');
          } catch (emailError) {
            console.error('⚠ Failed to send email:', emailError.message);
          }
        }

        await session.commitTransaction();
        console.log(`========================================\n`);
        
        res.json({
          success: true,
          message: 'Payment completed successfully'
        });

      } else {
        console.log('❌ Payment failed or pending');
        
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
        console.log(`========================================\n`);

        res.json({
          success: false,
          message: 'Payment failed',
          error: decodedResponse.message
        });
      }
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Error handling callback:', error);
    console.log(`========================================\n`);
    
    res.status(500).json({
      success: false,
      message: 'Callback processing failed',
      error: error.message
    });
  } finally {
    session.endSession();
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

        if (statusResponse.success && statusResponse.data) {
          const { state, responseCode, transactionId } = statusResponse.data;

          if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
            payment.status = 'paid';
            payment.state = state;
            payment.responseCode = responseCode;
            payment.phonepePaymentId = transactionId;
            payment.paymentDate = new Date();
            await payment.save();

            await Order.findByIdAndUpdate(payment.orderId._id, {
              paymentStatus: 'paid',
              status: 'confirmed',
              phonepePaymentId: transactionId,
              paymentDate: new Date()
            });

            try {
              const actualUserId = userId || payment.userId;
              await awardCoins(actualUserId, payment.amount, payment.orderId._id);
            } catch (coinsError) {
              console.error('Error awarding coins:', coinsError);
            }

            console.log(`✓ Payment status updated to paid`);
            
          } else if (state === 'FAILED') {
            payment.status = 'failed';
            payment.state = state;
            payment.responseCode = responseCode;
            await payment.save();

            await Order.findByIdAndUpdate(payment.orderId._id, {
              paymentStatus: 'failed',
              status: 'cancelled'
            });

            console.log(`✓ Payment status updated to failed`);
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
        merchantOrderId: payment.phonepeTransactionId,
        phonepeOrderId: payment.phonepeOrderId,
        phonepePaymentId: payment.phonepePaymentId,
        status: payment.status,
        state: payment.state,
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: payment.paymentDate,
        expireAt: payment.expireAt,
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

    console.log(`\n========================================`);
    console.log(`Processing refund: ${merchantOrderId}`);
    console.log(`========================================`);

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

    const refundTransactionId = `REF_${phonePeService.merchantId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`.substring(0, 35);

    console.log(`Refund Transaction ID: ${refundTransactionId}`);
    console.log(`Refund Amount: ₹${refundAmount}`);

    const refundResponse = await phonePeService.initiateRefund({
      userId: `USER_${userId.toString().substring(0, 15)}`,
      originalTransactionId: merchantOrderId,
      refundTransactionId: refundTransactionId,
      amount: Math.round(refundAmount * 100)
    });

    if (!refundResponse.success) {
      throw new Error(refundResponse.message || 'Refund failed');
    }

    console.log(`✓ Refund initiated successfully`);

    const coinsToDeduct = calculateCoins(refundAmount);
    if (coinsToDeduct > 0) {
      try {
        const user = await User.findById(userId);
        if (user && user.coins >= coinsToDeduct) {
          await User.findByIdAndUpdate(
            userId,
            { $inc: { coins: -coinsToDeduct } }
          );
          console.log(`✓ Deducted ${coinsToDeduct} coins`);
        }
      } catch (coinsError) {
        console.error('⚠ Error deducting coins:', coinsError);
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

    console.log(`✓ Refund processed successfully`);
    console.log(`========================================\n`);

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
    console.error('❌ Error processing refund:', error);
    console.log(`========================================\n`);
    
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
      clientId: !!phonePeService.clientId,
      clientSecret: !!phonePeService.clientSecret,
      environment: phonePeService.environment,
      configured: !!(phonePeService.merchantId && phonePeService.clientId && phonePeService.clientSecret)
    };

    res.json({
      success: true,
      health: {
        configuration: configStatus,
        phonePeService: {
          status: configStatus.configured ? 'healthy' : 'misconfigured',
          message: 'PhonePe Production SDK',
          environment: phonePeService.environment,
          merchantId: phonePeService.merchantId
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
        status: 'error',
        error: error.message
      }
    });
  }
};

const getPhonePeConfig = async (req, res) => {
  try {
    const config = {
      merchantId: phonePeService.merchantId,
      environment: phonePeService.environment,
      clientId: phonePeService.clientId,
      clientVersion: phonePeService.clientVersion,
      redirectUrl: phonePeService.redirectUrl,
      callbackUrl: phonePeService.callbackUrl,
      configured: !!(phonePeService.merchantId && phonePeService.clientId && phonePeService.clientSecret),
      version: 'production',
      builderPattern: true,
      sdkType: 'StandardCheckoutPayRequest'
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
  getPhonePeConfig,
  calculateCoins,
  awardCoins
};

