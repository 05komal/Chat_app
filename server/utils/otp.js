// server/utils/otp.js

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * 10));
  }
  return otp;
};

const storeOTP = (phone, otp, expiryMinutes = 10) => {
  const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
  otpStore.set(phone, {
    otp,
    expiryTime,
    attempts: 0,
  });
  console.log(`OTP for ${phone}: ${otp}`); // Log for development
};

const verifyOTP = (phone, otp) => {
  const stored = otpStore.get(phone);
  
  if (!stored) {
    return { success: false, error: 'OTP not found' };
  }
  
  if (Date.now() > stored.expiryTime) {
    otpStore.delete(phone);
    return { success: false, error: 'OTP expired' };
  }
  
  if (stored.attempts >= 5) {
    otpStore.delete(phone);
    return { success: false, error: 'Too many attempts. Please request a new OTP' };
  }
  
  if (stored.otp !== otp) {
    stored.attempts += 1;
    return { success: false, error: 'Invalid OTP' };
  }
  
  otpStore.delete(phone);
  return { success: true };
};

const deleteOTP = (phone) => {
  otpStore.delete(phone);
};

const getOTPAttempts = (phone) => {
  const stored = otpStore.get(phone);
  return stored ? stored.attempts : 0;
};

// Function to format phone number
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If doesn't start with +, add + for international format
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  deleteOTP,
  getOTPAttempts,
  formatPhoneNumber,
};
