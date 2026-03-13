const OTPschema=require("../../model/OTPschema");
const generateOTP=require("../../utils/generateOTP");
const sendEmail = require("../../utils/sendEmail");

   async function createOtpAndSend(userId, purpose, email,subject) {
    console.log("createOtpAndSend called");
    console.log("Purpose:", purpose);
    console.log("UserId:", userId);
    await OTPschema.deleteMany({ userId });
    const otp = generateOTP();
    console.log(otp)
    await OTPschema.create({
      userId: userId,
      otp,
      otpPurpose: purpose,
      otpExpiry: new Date(Date.now() + 2 * 60 * 1000),
    });
    await sendEmail(email, subject, `Your OTP is ${otp}`);
  }

  module.exports={createOtpAndSend}