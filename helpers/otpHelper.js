// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if OTP is valid (not expired)
const isOTPValid = (otpExpires) => {
  return new Date() < new Date(otpExpires);
};

module.exports = {
  generateOTP,
  isOTPValid
};