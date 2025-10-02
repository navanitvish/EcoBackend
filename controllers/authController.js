// ============================================
// 1. INSTALL REQUIRED PACKAGES
// ============================================
// npm install google-auth-library

// ============================================
// 2. ENVIRONMENT VARIABLES (.env file)
// ============================================
/*
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
*/

// ============================================
// 3. UPDATED AUTH CONTROLLER (authController.js)
// ============================================
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../helpers/emailHelper');
const { generateOTP } = require('../helpers/otpHelper');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register with Email & Password
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('\n🔵 REGISTRATION REQUEST:', { name, email, password: '***' });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      isVerified: false
    });

    await user.save();
    console.log('✅ User created with ID:', user._id);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log('🔐 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', otpExpires);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log('💾 User updated with OTP info');

    await sendOTPEmail(email, otp, user.name);

    res.status(201).json({
      message: 'Registration successful! Please check your email for OTP verification.',
      userId: user._id,
      otpSent: true,
      debug: {
        otp: otp,
        expires: otpExpires,
        email: email
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const searchEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: searchEmail });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        coins: user.coins
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login with Email & Password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('\n🔵 LOGIN REQUEST:', { email, password: '***' });

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.email);
    console.log('Is verified:', user.isVerified);

    if (!user.isVerified) {
      console.log('⚠️ User not verified, sending new OTP');
      
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
      
      await sendOTPEmail(email, otp, user.name);
      
      return res.status(400).json({ 
        message: 'Please verify your email first. New OTP sent to your email.',
        needsVerification: true,
        debug: { otp: otp }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    console.log('✅ Login successful');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        coins: user.coins
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('\n🔵 RESEND OTP REQUEST:', email);

    const user = await User.findOne({ email, isVerified: false });
    if (!user) {
      return res.status(400).json({ message: 'User not found or already verified' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log('🔐 New OTP generated:', otp);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendOTPEmail(email, otp, user.name);

    res.json({ 
      message: 'New OTP sent to your email',
      debug: { otp: otp }
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// ✨ UPDATED: Google OAuth Sign In/Sign Up (accepts user data directly)
const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId, profileImage } = req.body;
    console.log('\n🔵 GOOGLE AUTH REQUEST:', { email, name, googleId });

    // Validate required fields
    if (!email || !googleId) {
      return res.status(400).json({ 
        message: 'Email and Google ID are required' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Existing user - just log them in
      console.log('✅ Existing user found');
      
      // Update Google info if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (profileImage && (!user.profileImage || user.profileImage.includes('unsplash'))) {
        user.profileImage = profileImage;
      }
      
      await user.save();
    } else {
      // New user - create account
      console.log('✅ Creating new Google user');
      
      user = new User({
        name,
        email,
        googleId,
        isVerified: true,
        password: null, // Explicitly set to null for Google users
        profileImage: profileImage || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600'
      });

      await user.save();
      console.log('✅ New Google user created with ID:', user._id);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        coins: user.coins,
        phone: user.phone,
        location: user.location,
        membershipType: user.membershipType
      }
    });

  } catch (error) {
    console.error('❌ Google auth error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'This Google account is already registered',
        error: 'Duplicate account'
      });
    }
    
    res.status(500).json({ 
      message: 'Google authentication failed',
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  googleAuth
};