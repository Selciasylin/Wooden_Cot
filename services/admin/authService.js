const User = require("../../model/userSchema");
async function loginAdmin(email, password){
    if (!email || !password) {
        throw new Error("All fields are required");
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (email !== adminEmail || password !== adminPassword) {
        throw new Error("Invalid email or password");
    }
    return {
        email: adminEmail
    };
};
async function getAllUsers() {
    const users = await User.find({}).sort({ createdAt: -1 }); 
    return users;
}
async function toggleUserBlockStatus(userId){
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isBlocked: !user.isBlocked },
        { new: true }
    );
    return updatedUser;
}
module.exports={loginAdmin,getAllUsers,toggleUserBlockStatus}