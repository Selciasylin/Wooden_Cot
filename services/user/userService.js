const User = require("../../model/userSchema");
const Otp = require("../../model/OTPschema");
const bcrypt = require("bcryptjs");
const generateOTP = require("../../utils/generateOTP");
const sendEmail = require("../../utils/sendEmail");
async function createUser(userData) {
    const{firstName,lastName,email,phoneNumber,password,referralCode}=userData
    const existingUser = await User.findOne({email})
    if(existingUser){
        if (existingUser.isBlocked) {
            throw new Error("This account is blocked. Contact support.");
        }
        throw new Error("User already exists")
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser=await User.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password:hashedPassword,
        referralCode, 
        isVerified:false
    })
     const otp = generateOTP();
     console.log(otp)
     await Otp.create({
        userId: newUser._id,
        otp,
        otpPurpose: "signup",
        otpExpiry: new Date(Date.now() + 2 * 60 * 1000)
    });
    await sendEmail(email, "Verify Your Account", `Your OTP is ${otp}`);
    return newUser
}
async function loginUser(loginData) {
    const { email, password } = loginData;
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("User not exists");
    }
    if (user.isBlocked) {
        throw new Error("Your account has been blocked by admin");
    }
    if (!user.isVerified) {
        const error = new Error("Account not verified");
        error.type = "NOT_VERIFIED";
        error.userId = user._id;
        throw error;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid Email or Password");
    }
    return user;
}
async function forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    if (user.isBlocked) {
        throw new Error("Your account is blocked");
    }
    const otp = generateOTP();
    console.log(otp)
    await Otp.create({
        userId: user._id,
        otp,
        otpPurpose: "forgotPassword",
        otpExpiry: new Date(Date.now() + 2 * 60 * 1000)
    });
    await sendEmail(email, "Password Reset OTP", `Your OTP is ${otp}`);
    return user;
}
async function verifyOtp(userId, enteredOtp) {
    const user = await User.findById(userId);
    if (!user){
        throw new Error("User not found");
    }
    const otpRecord = await Otp.findOne({ userId }).sort({ createdAt: -1 });
    if(!otpRecord){
        throw new Error("OTP not found")
    }
    if (otpRecord.otp!==enteredOtp){
        throw new Error("Invalid OTP");
    }
    if (otpRecord.otpExpiry < new Date()){
        throw new Error("OTP Expired");
    }
    const purpose=otpRecord.otpPurpose
    if(purpose=="signup"){
        user.isVerified = true;
        await user.save();
    } 
    await Otp.deleteMany({ userId });
    return {user,purpose};
}
async function resetPassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
}
async function handleGoogleUser(profile){
    try {
        const email = profile.emails[0].value;
        const user = await User.findOneAndUpdate({ email: email },
        {
        $set: {
            name: profile.displayName,
            googleId: profile.id,
            profileImage: profile.photos[0].value,
            isVerified: true 
        }
        },
        {
        upsert: true,
        new: true
        }
    );
    return user;
    }  
    catch (error) {
        throw error;
    }
};

module.exports={createUser,loginUser,forgotPassword,verifyOtp,resetPassword,handleGoogleUser}