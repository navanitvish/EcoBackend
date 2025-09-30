const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const user = await User.findById(decoded.userId).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Set both req.userId and req.user for compatibility
    req.userId = decoded.userId;
    req.user = { 
      id: decoded.userId, 
      ...user.toObject() 
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -otp -otpExpires');
    
    if (user && user.isVerified) {
      req.userId = decoded.userId;
      req.user = { 
        id: decoded.userId, 
        ...user.toObject() 
      };
    } else {
      req.user = null;
      req.userId = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    req.userId = null;
    next();
  }
};

// Admin role middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role (assuming you have a role field)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization failed'
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
};