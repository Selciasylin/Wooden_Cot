const User = require("../../model/userSchema");
const bcrypt = require("bcryptjs");
async function getUserById(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
        throw new Error("User not found");
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
    if (!user) throw new Error("User not found");
    if (!user.password) {
        throw new Error("Google users cannot change password");
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error("Current password is incorrect");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
}
module.exports={getUserById,updateUserProfile,changeUserPassword}