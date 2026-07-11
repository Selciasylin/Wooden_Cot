const User = require("../../model/userSchema");
const Otp = require("../../model/OTPschema");
const bcrypt = require("bcryptjs");
const generateOTP = require("../../utils/generateOTP");
const sendEmail = require("../../utils/sendEmail");
const appError = require("../../utils/appError");

async function getUserById(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
        throw new appError("User not found");
    }
    return user;
}

async function updateUserProfile(userId, updateData) {
    const { firstName, lastName, phoneNumber } = updateData;
    const updatedUser = await User.findByIdAndUpdate(userId,
        { firstName, lastName, phoneNumber },
        { new: true }
    );
    return updatedUser;
}

async function changeUserPassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new appError("User not found");
    if (!user.password) {
        throw new appError("Google users cannot change password");
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new appError("Current password is incorrect");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
}

// 🔹 NEW: Upload/Update profile image (works for normal + google users)
async function updateProfileImage(userId, imageUrl) {
    const user = await User.findByIdAndUpdate(
        userId,
        { profileImage: imageUrl },
        { new: true }
    );
    if (!user) throw new appError("User not found");
    return user;
}

// 🔹 NEW: Step 1 - validate + send OTP to new email
async function initiateEmailChange(userId, newEmail, password) {
    const user = await User.findById(userId);
    if (!user) throw new appError("User not found");

    // Block google users
    if (!user.password) {
        throw new appError("Google users cannot change email");
    }

    if (!newEmail || !password) {
        throw new appError("Email and password are required");
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        throw new appError("Enter a valid email address");
    }

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
        throw new appError("New email cannot be same as current email");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new appError("Password is incorrect");
    }

    // Check new email not already used by another account
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) {
        throw new appError("This email is already in use");
    }

    // Clear old pending OTPs for this user + purpose
    await Otp.deleteMany({ userId, otpPurpose: "changeEmail" });

    const otp = generateOTP();
    console.log(otp)
    await Otp.create({
        userId,
        otp,
        otpPurpose: "changeEmail",
        otpExpiry: new Date(Date.now() + 2 * 60 * 1000),
        newEmail: newEmail.toLowerCase()
    });

    await sendEmail(newEmail, "Verify Your New Email", `Your OTP is ${otp}`);
}

// 🔹 NEW: Step 2 - verify OTP and update email
async function verifyEmailChange(userId, enteredOtp) {
    const otpRecord = await Otp.findOne({ userId, otpPurpose: "changeEmail" }).sort({ createdAt: -1 });

    if (!otpRecord) {
        throw new appError("OTP not found. Please try again");
    }
    if (otpRecord.otp !== enteredOtp) {
        throw new appError("Invalid OTP");
    }
    if (otpRecord.otpExpiry < new Date()) {
        throw new appError("OTP expired. Please try again");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { email: otpRecord.newEmail },
        { new: true }
    );

    await Otp.deleteMany({ userId, otpPurpose: "changeEmail" });

    return updatedUser;
}

module.exports = {
    getUserById,
    updateUserProfile,
    changeUserPassword,
    updateProfileImage,
    initiateEmailChange,
    verifyEmailChange
};