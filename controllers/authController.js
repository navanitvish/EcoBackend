const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../helpers/emailHelper');
const { generateOTP } = require('../helpers/otpHelper');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register with Email & Password
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('\n🔵 REGISTRATION REQUEST:', { name, email, password: '***' });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (NOT VERIFIED YET)
    const user = new User({
      name,
      email,
      password,
      isVerified: false
    });

    await user.save();
    console.log('✅ User created with ID:', user._id);

    // Generate and send OTP immediately after registration
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('🔐 Generated OTP:', otp);
    console.log('⏰ OTP expires at:', otpExpires);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log('💾 User updated with OTP info');

    // Send OTP email
    await sendOTPEmail(email, otp, user.name);

    res.status(201).json({
      message: 'Registration successful! Please check your email for OTP verification.',
      userId: user._id,
      otpSent: true,
      // FOR DEBUGGING - REMOVE IN PRODUCTION
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

// Verify OTP with detailed debugging
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Normalize email
    const searchEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: searchEmail });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check OTP and expiration
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP and verify
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    // Generate JWT
    const token = generateToken(user._id);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
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

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.email);
    console.log('Is verified:', user.isVerified);

    // Check if user is verified
    if (!user.isVerified) {
      console.log('⚠️ User not verified, sending new OTP');
      
      // Generate new OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
      
      await sendOTPEmail(email, otp, user.name);
      
      return res.status(400).json({ 
        message: 'Please verify your email first. New OTP sent to your email.',
        needsVerification: true,
        debug: { otp: otp } // FOR DEBUGGING
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('✅ Login successful');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
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

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    console.log('🔐 New OTP generated:', otp);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp, user.name);

    res.json({ 
      message: 'New OTP sent to your email',
      debug: { otp: otp } // FOR DEBUGGING
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Google OAuth (UNCHANGED - Your existing logic)
const googleAuth = async (req, res) => {
  try {
    const { name, email, googleId } = req.body;
    console.log('\n🔵 GOOGLE AUTH REQUEST:', { name, email, googleId });

    // Find or create user
    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    
    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        isVerified: true,
        password: undefined
      });
      await user.save();
      console.log('✅ New Google user created');
    } else {
      if (!user.isVerified) {
        user.isVerified = true;
        user.googleId = googleId;
        await user.save();
        console.log('✅ Existing user verified via Google');
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  googleAuth
};