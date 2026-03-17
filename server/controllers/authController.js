// server/controllers/authController.js
const User = require('../models/User');
const { generateOTP, storeOTP, verifyOTP, formatPhoneNumber } = require('../utils/otp');
const { generateToken } = require('../utils/jwt');

/**
 * Step 1: Register with phone number
 * Generates and sends OTP to the phone
 */
const register = async (req, res) => {
  try {
    const { phone, firstName = '', lastName = '', email = '' } = req.body;
    
    const formattedPhone = formatPhoneNumber(phone);
    
    // Check if phone already exists
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser && existingUser.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered',
      });
    }
    
    // Generate and store OTP
    const otp = generateOTP(6);
    storeOTP(formattedPhone, otp, 10); // 10 minutes expiry
    
    // In production, send OTP via SMS/Email
    // sendOTPViaSMS(formattedPhone, otp);
    // sendOTPViaEmail(email, otp);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone',
      data: {
        phone: formattedPhone,
        expiresIn: '10 minutes',
        // In development only:
        _debug_otp: otp,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration error',
      error: error.message,
    });
  }
};

/**
 * Step 2: Verify OTP and create account
 */
const verifyOTPAndCreateAccount = async (req, res) => {
  try {
    const { phone, otp, password, firstName = '', lastName = '' } = req.body;
    
    const formattedPhone = formatPhoneNumber(phone);
    
    // Verify OTP
    const otpResult = verifyOTP(formattedPhone, otp);
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.error,
      });
    }
    
    // Check if user exists
    let user = await User.findOne({ phone: formattedPhone });
    
    if (user) {
      // Update existing unverified user
      user.password = password;
      user.firstName = firstName;
      user.lastName = lastName;
      user.isPhoneVerified = true;
    } else {
      // Create new user
      user = new User({
        phone: formattedPhone,
        password,
        firstName,
        lastName,
        isPhoneVerified: true,
        username: `user_${Date.now()}`, // Generate default username
      });
    }
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OTP verification error',
      error: error.message,
    });
  }
};

/**
 * Resend OTP
 */
const resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const formattedPhone = formatPhoneNumber(phone);
    
    // Generate new OTP
    const otp = generateOTP(6);
    storeOTP(formattedPhone, otp, 10);
    
    res.status(200).json({
      success: true,
      message: 'New OTP sent to your phone',
      data: {
        phone: formattedPhone,
        // In development only:
        _debug_otp: otp,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Resend OTP error',
      error: error.message,
    });
  }
};

/**
 * Login with phone and password
 */
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const formattedPhone = formatPhoneNumber(phone);
    
    // Find user
    const user = await User.findOne({ phone: formattedPhone }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password',
      });
    }
    
    // Check if phone is verified
    if (!user.isPhoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Phone number not verified. Please verify first',
      });
    }
    
    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password',
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }
    
    // Update status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message,
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

/**
 * Logout
 */
const logout = async (req, res) => {
  try {
    const user = req.user;
    user.status = 'offline';
    user.lastSeen = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout error',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  verifyOTPAndCreateAccount,
  resendOTP,
  login,
  getProfile,
  logout,
};
