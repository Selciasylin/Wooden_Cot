const User = require("../../model/userSchema");
const appError = require("../../utils/appError");
async function getAllUsers() {
    const users = await User.find({}).sort({ createdAt: -1 }); 
    console.log(users)
    return users;
}
async function toggleUserBlockStatus(userId){
    const user = await User.findById(userId);
    if (!user) {
        throw new appError("User not found");
    }
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isBlocked: !user.isBlocked },
        { new: true }
    );
    return updatedUser;
}
async function getUsers(query, page, limit){

  return await User.find(query)
    .sort({ createdAt:-1 })
    .skip((page-1)*limit)
    .limit(limit)

}
async function countUsers(query){
  return await User.countDocuments(query)
}
module.exports={getAllUsers,toggleUserBlockStatus,getUsers,countUsers}