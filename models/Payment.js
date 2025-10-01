const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // PhonePe specific fields
  phonepeTransactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phonepeMerchantTransactionId: {
    type: String,
    required: true,
    index: true
  },
  phonepeOrderId: {
    type: String,
    index: true
  },
  phonepePaymentId: {
    type: String,
    index: true,
    sparse: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD']
  },
  status: {
    type: String,
    enum: ['created', 'pending', 'attempted', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'created',
    index: true
  },
  
  // PhonePe response fields
  state: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED']
  },
  responseCode: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'other']
  },
  paymentInstrument: {
    type: String // UPI, CARD, NET_BANKING, etc.
  },
  
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  contact: {
    type: String,
    required: true
  },
  paymentUrl: {
    type: String // PhonePe payment page URL
  },
  paymentDate: {
    type: Date,
    index: true
  },
  expireAt: {
    type: Number // Epoch timestamp when payment expires
  },
  failureReason: {
    type: String
  },
  
  refunds: [{
    refundId: String,
    amount: Number,
    currency: String,
    status: String,
    createdAt: { type: Date, default: Date.now },
    processedAt: Date,
    reason: String,
    notes: String
  }],
  
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for checking if payment is successful
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'paid';
});

// Virtual for checking if payment is pending
paymentSchema.virtual('isPending').get(function() {
  return this.status === 'created' || this.status === 'pending';
});

// Method to check if payment is expired
paymentSchema.methods.isExpired = function() {
  if (!this.expireAt) return false;
  return Date.now() > this.expireAt;
};

module.exports = mongoose.model('Payment', paymentSchema);