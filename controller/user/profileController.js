const userService = require("../../services/user/profileService");
const bcrypt = require("bcryptjs");
async function renderProfile(req, res) {
  try {
    const user = await userService.getUserById(req.session.userId);
    res.render("user/profile/profileDetails", { user });
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = {
      type: "error",
      text: "Something went wrong"
    };
    return res.redirect("/");
  }
}
async function updateProfile(req, res) {
  try {
    await userService.updateUserProfile(req.session.userId,req.body);
    return res.json({ status: "SUCCESS" });
  } catch (error) {
      if (error.isOperational) {
        return res.json({
          status: "ERROR",
          message: error.message
        });
      }
      console.error("Internal Error:", error);
      return res.json({
        status: "ERROR",
        message: "Something went wrong"
      });
  }
}
async function changePassword(req, res) {
    try {
        await userService.changeUserPassword(req.session.userId,req.body.currentPassword,req.body.newPassword);
        return res.json({ status: "SUCCESS" });
    } catch (error) {
        if (error.isOperational) {
        return res.json({
          status: "ERROR",
          message: error.message
        });
      }
      console.error("Internal Error:", error);
      return res.json({
        status: "ERROR",
        message: "Something went wrong"
      });
    }
}
module.exports = {renderProfile,updateProfile,changePassword}