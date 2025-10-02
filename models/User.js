// 1. UPDATE USER MODEL (Add new fields to existing schema)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Password required only for non-Google users
        return !this.googleId;
      },
      default: null,
    },
  googleId: {
  type: String,
  unique: true,  // Add this
  sparse: true,  // Already there - good! This allows multiple null values
},
   
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    // ✨ NEW PROFILE FIELDS
    phone: {
      type: String,
      default: "+91 98765 43210",
    },
    location: {
      type: String,
      default: "Ghaziabad, Uttar Pradesh, India",
    },
    profileImage: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFufGVufDB8fDB8fHww",
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (v) {
          return v >= 0;
        },
        message: "Coins cannot be negative",
      },
    },
    membershipType: {
      type: String,
      default: "Premium Member",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Hash password before saving (skip for Google users or null passwords)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false; // Google users have no password
  return await bcrypt.compare(password, this.password);
};

// Instance method to update coins
userSchema.methods.addCoins = function(amount) {
  this.coins = (this.coins || 0) + amount;
  return this.save();
};

// Instance method to deduct coins
userSchema.methods.deductCoins = function(amount) {
  if (this.coins < amount) {
    throw new Error('Insufficient coins balance');
  }
  this.coins = this.coins - amount;
  return this.save();
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Static method to find users with coins
userSchema.statics.findUsersWithCoins = function() {
  return this.find({ coins: { $gt: 0 } });
};

// Virtual for coins in rupees (if you want to show coins value in currency)
userSchema.virtual('coinsValue').get(function() {
  return this.coins; // 1 coin = 1 rupee
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ coins: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
