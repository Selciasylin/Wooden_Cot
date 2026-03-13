const User = require("../../model/userSchema");
const bcrypt = require("bcryptjs");
const Otp=require("../../model/OTPschema");
const appError = require("../../utils/appError");
const {createOtpAndSend} = require("../common/otpService");
async function createUser(userData) {
  const { firstName, lastName, email, phoneNumber, password, referralCode } = userData;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.isBlocked) {
      throw new appError("This account is blocked. Contact support.");
    }
    throw new appError("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    phoneNumber,
    password: hashedPassword,
    referralCode,
    isVerified: false,
  });
  await createOtpAndSend(newUser._id,"signup",newUser.email,"Verify Your Account")
  return newUser;
}
async function loginUser(loginData) {
  const { email, password } = loginData;
  const user = await User.findOne({ email });
  if (!user) {
    throw new appError("User not exists");
  }
  if (user.isBlocked) {
    throw new appError("Your account has been blocked by admin");
  }
  if (!user.isVerified) {
    const error = new appError("Account not verified");
    error.type = "NOT_VERIFIED";
    error.userId = user._id;
    throw error;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new appError("Invalid Email or Password");
  }
  return user;
}
async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new appError("User not found");
  }
  if (user.isBlocked) {
    throw new appError("Your account is blocked");
  }
  await createOtpAndSend(user._id,"forgotPassword",user.email,"Password Reset OTP")
  return user;
}
async function verifyOtp(userId, enteredOtp) {
  const user = await User.findById(userId);
  if (!user) {
    throw new appError("User not found");
  }
  const otpRecord = await Otp.findOne({ userId }).sort({ createdAt: -1 });
  if (!otpRecord) {
    throw new appError("OTP not found");
  }
  if (otpRecord.otp !== enteredOtp) {
    throw new appError("Invalid OTP");
  }
  if (otpRecord.otpExpiry < new Date()) {
    throw new appError("OTP Expired");
  }
  const purpose = otpRecord.otpPurpose;
  if (purpose == "signup") {
    user.isVerified = true;
    await user.save();
  }
  await Otp.deleteMany({ userId });
  return { user, purpose };
}
async function resetPassword(userId, newPassword) {
  const user = await User.findById(userId);
  if (!user) {
    throw new appError("User not found");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
}

async function handleGoogleUser(profile) {
  try {
    const email = profile.emails[0].value;
    const user = await User.findOneAndUpdate(
      { email: email },
      {
        $set: {
          name: profile.displayName,
          googleId: profile.id,
          profileImage: profile.photos[0].value,
          isVerified: true,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
    return user;
  } catch (error) {
    throw error;
  }
}
async function generateSignupOtp(userId) {
    const user = await User.findById(userId);
    if (!user){
       throw new appError("User not found");
    } 
    await createOtpAndSend(user._id,"signup",user.email,"verify Your Account")
}

module.exports = {
  createUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  handleGoogleUser,
  generateSignupOtp
};
