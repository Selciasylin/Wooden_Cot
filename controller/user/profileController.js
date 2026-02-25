const userService = require("../../services/user/profileService");
const bcrypt = require("bcryptjs");
async function renderProfile(req, res) {
  try {
    const user = await userService.getUserById(req.session.userId);
    res.render("user/profile/profileDetails", { user });
  } catch (error) {
    res.redirect("/");
  }
}
async function updateProfile(req, res) {
  try {
    await userService.updateUserProfile(req.session.userId,req.body);
    return res.json({ status: "SUCCESS" });
  } catch (error) {
    return res.json({
      status: "ERROR",
      message: error.message
    });
  }
}
async function changePassword(req, res) {
    try {
        await userService.changeUserPassword(req.session.userId,req.body.currentPassword,req.body.newPassword);
        return res.json({ status: "SUCCESS" });
    } catch (error) {
        return res.json({
            status: "ERROR",
            message: error.message
        });
    }
}
module.exports = {renderProfile,updateProfile,changePassword}