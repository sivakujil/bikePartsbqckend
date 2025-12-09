import crypto from 'crypto';

// Generate a 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate pickup and delivery OTPs
export const generateOrderOTPs = () => {
  return {
    pickup: generateOTP(),
    delivery: generateOTP()
  };
};

// Send OTP via email (placeholder - integrate with email service)
export const sendOTP = async (email, otp, type = 'verification') => {
  // TODO: Integrate with email service like Nodemailer
  console.log(`OTP ${otp} sent to ${email} for ${type}`);

  // For now, just return success
  return { success: true, message: `OTP sent to ${email}` };
};

// Send OTP via SMS (placeholder - integrate with SMS service)
export const sendSMSOTP = async (phone, otp, type = 'verification') => {
  // TODO: Integrate with SMS service like Twilio
  console.log(`OTP ${otp} sent to ${phone} for ${type}`);

  // For now, just return success
  return { success: true, message: `OTP sent to ${phone}` };
};